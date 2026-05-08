import { useCallback, useEffect, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useChatStore } from "@/stores/chatStore";
import { useModelStore } from "@/stores/modelStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { useMemoryStore } from "@/stores/memoryStore";
import { MemoryManager } from "@/memory/MemoryManager";
import { ChatEngine } from "@/components/ai/ChatEngine";
import { parseAIResponse } from "@/components/ai/ResponseParser";

interface UseStreamingChatOptions {
  projectId: string;
  pageId: string;
}

interface StreamPayload {
  request_id: string;
  event_type: string;
  content: string | null;
  error: string | null;
}

export function useStreamingChat({ projectId, pageId }: UseStreamingChatOptions) {
  const engineRef = useRef(new ChatEngine());
  const memoryManagerRef = useRef(new MemoryManager());
  const unlistenRef = useRef<UnlistenFn | null>(null);
  const requestIdRef = useRef<string>("");

  const isStreaming = useChatStore((s) => s.isStreaming);
  const startStreaming = useChatStore((s) => s.startStreaming);
  const appendStreamContent = useChatStore((s) => s.appendStreamContent);
  const stopStreaming = useChatStore((s) => s.stopStreaming);
  const addMessage = useChatStore((s) => s.addMessage);
  const setActiveSkill = useChatStore((s) => s.setActiveSkill);
  const getDefaultTextModel = useModelStore((s) => s.getDefaultTextModel);
  const getDefaultVisionModel = useModelStore((s) => s.getDefaultVisionModel);

  useEffect(() => {
    const mm = memoryManagerRef.current;
    let cancelled = false;
    (async () => {
      const [prefs, projectCtx] = await Promise.all([
        mm.loadUserPreferences(),
        projectId ? mm.loadProjectContext(projectId) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      useMemoryStore.getState().setPreferences(prefs);
      if (projectCtx) useMemoryStore.getState().setProjectContext(projectCtx);
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    let mounted = true;

    const setupListener = async () => {
      unlistenRef.current = await listen<StreamPayload>("ai-stream", (event) => {
        const payload = event.payload;

        if (payload.request_id !== requestIdRef.current) return;

        if (payload.event_type === "delta" && payload.content) {
          appendStreamContent(payload.content);
        } else if (payload.event_type === "done") {
          const currentContent = useChatStore.getState().streamingContent;
          stopStreaming(true);

          const parsed = parseAIResponse(currentContent);

          if (parsed.response) {
            const { messages } = useChatStore.getState();
            const lastMsg = messages[messages.length - 1];
            if (lastMsg && lastMsg.role === "assistant") {
              const updatedMessages = messages.slice(0, -1);
              updatedMessages.push({
                ...lastMsg,
                content: parsed.replyText,
                canvasUpdated: !!(parsed.response.html),
                skillUsed: parsed.response.skillUsed,
              });
              useChatStore.getState().setMessages(updatedMessages);

              if (parsed.response.skillUsed) {
                setActiveSkill(parsed.response.skillUsed);
              }
            }

            const memoryUpdates = parsed.response.memoryUpdates;
            if (memoryUpdates) {
              const mm = memoryManagerRef.current;
              const extracted = mm.extractMemoryUpdates({ memory_updates: memoryUpdates });
              const memState = useMemoryStore.getState();
              if (Object.keys(extracted.preferences).length > 0) {
                const cleanPrefs: Record<string, string> = {};
                for (const [k, v] of Object.entries(extracted.preferences)) {
                  if (v !== undefined) cleanPrefs[k] = v;
                }
                memState.updatePreferences(cleanPrefs);
                mm.saveUserPreferences({ ...memState.userPreferences, ...cleanPrefs });
              }
              if (Object.keys(extracted.designSystem).length > 0 && projectId) {
                const existing = memState.projectContext ?? { designSystem: {}, iterationLog: [], glossary: {} };
                const updatedCtx = {
                  ...existing,
                  designSystem: { ...existing.designSystem, ...extracted.designSystem },
                  iterationLog: [
                    ...existing.iterationLog,
                    { timestamp: new Date().toISOString(), action: "ai-update", detail: "AI updated design system" },
                  ],
                };
                memState.setProjectContext(updatedCtx);
                mm.saveProjectContext(projectId, updatedCtx);
              }
            }
          }

          saveChatHistory();
        } else if (payload.event_type === "error") {
          stopStreaming(false);
          addMessage({
            id: `msg-error-${Date.now()}`,
            role: "assistant",
            content: `请求失败: ${payload.error ?? "未知错误"}`,
            images: [],
            timestamp: new Date().toISOString(),
          });
          useChatStore.getState().setStreamingState('error');
        }
      });
    };

    if (mounted) setupListener();

    return () => {
      mounted = false;
      unlistenRef.current?.();
      unlistenRef.current = null;
    };
  }, [appendStreamContent, stopStreaming, addMessage, setActiveSkill]);

  const saveChatHistory = useCallback(async () => {
    if (!projectId || !pageId) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const messages = useChatStore.getState().messages;
      const history = {
        pageId,
        projectId,
        messages,
        updatedAt: new Date().toISOString(),
      };
      await invoke("save_chat_history", {
        projectId,
        pageId,
        json: JSON.stringify(history),
      });
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  }, [projectId, pageId]);

  const send = useCallback(async (text: string, images: string[]) => {
    const hasImages = images.length > 0;
    const model = hasImages
      ? getDefaultVisionModel()
      : getDefaultTextModel();

    if (!model) {
      addMessage({
        id: `msg-sys-${Date.now()}`,
        role: "assistant",
        content: "No AI model configured. Please go to Settings and configure a model first.",
        images: [],
        timestamp: new Date().toISOString(),
      });
      return;
    }

    addMessage({
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      images,
      timestamp: new Date().toISOString(),
    });

    const requestId = engineRef.current.generateRequestId();
    requestIdRef.current = requestId;

    const canvasStore = useCanvasStore.getState();
    const chatMessages = useChatStore.getState().messages;

    const lastSnapshot = (canvasStore.history.length > 0 && canvasStore.historyIndex >= 0)
      ? canvasStore.history[canvasStore.historyIndex]
      : null;
    const canvasJSON = lastSnapshot
      ? JSON.stringify(lastSnapshot)
      : '{"version":"6","objects":[]}';

    const config = engineRef.current.buildRequest({
      modelConfig: model,
      messages: chatMessages,
      canvasJSON,
      canvasWidth: 1440,
      canvasHeight: 900,
      memoryContext: {
        userPreferences: useMemoryStore.getState().userPreferences,
        projectContext: useMemoryStore.getState().projectContext,
      },
    });

    startStreaming(requestId);

    try {
      await engineRef.current.sendRequest(config, requestId);
    } catch (error) {
      stopStreaming(false);
      addMessage({
        id: `msg-error-${Date.now()}`,
        role: "assistant",
        content: `请求失败: ${error instanceof Error ? error.message : String(error)}`,
        images: [],
        timestamp: new Date().toISOString(),
      });
      useChatStore.getState().setStreamingState('error');
    }
  }, [getDefaultTextModel, getDefaultVisionModel, addMessage, startStreaming, stopStreaming]);

  const cancel = useCallback(async () => {
    const requestId = requestIdRef.current;
    if (requestId) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("cancel_ai_request", { requestId });
      } catch {
        // Request may have already completed
      }
    }
    const controller = useChatStore.getState().abortController;
    if (controller) {
      controller.abort();
      useChatStore.getState().setAbortController(null);
    }
    stopStreaming(false);
    requestIdRef.current = "";
  }, [stopStreaming]);

  return {
    send,
    cancel,
    isLoading: isStreaming,
  };
}
