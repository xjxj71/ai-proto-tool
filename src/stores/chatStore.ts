import { create } from "zustand";
import type { ChatMessage } from "@/types";

export type StreamingState = 'idle' | 'streaming' | 'done' | 'error';

interface ChatState {
  messages: ChatMessage[];
  streamingContent: string;
  isStreaming: boolean;
  streamingState: StreamingState;
  activeRequestId: string;
  activeSkill: string;
  abortController: AbortController | null;

  addMessage: (message: ChatMessage) => void;
  startStreaming: (requestId: string) => void;
  appendStreamContent: (chunk: string) => void;
  stopStreaming: (finalizeAsMessage: boolean) => void;
  setStreamingState: (state: StreamingState) => void;
  setAbortController: (controller: AbortController | null) => void;
  setActiveSkill: (skill: string) => void;
  clearMessages: () => void;
  setMessages: (messages: ChatMessage[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  streamingContent: "",
  isStreaming: false,
  streamingState: 'idle' as StreamingState,
  activeRequestId: "",
  activeSkill: "",
  abortController: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  startStreaming: (requestId) =>
    set({ isStreaming: true, streamingState: 'streaming', activeRequestId: requestId, streamingContent: "" }),

  appendStreamContent: (chunk) =>
    set((state) => ({ streamingContent: state.streamingContent + chunk })),

  stopStreaming: (finalizeAsMessage) => {
    const { streamingContent, messages } = get();
    if (finalizeAsMessage && streamingContent) {
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: streamingContent,
        images: [],
        timestamp: new Date().toISOString(),
      };
      set({
        isStreaming: false,
        streamingState: 'done',
        activeRequestId: "",
        streamingContent: "",
        messages: [...messages, assistantMessage],
      });
    } else {
      set({
        isStreaming: false,
        streamingState: finalizeAsMessage ? 'done' : 'idle',
        activeRequestId: "",
        streamingContent: "",
      });
    }
  },

  setStreamingState: (state) => set({ streamingState: state }),

  setAbortController: (controller) => set({ abortController: controller }),

  setActiveSkill: (activeSkill) => set({ activeSkill }),

  clearMessages: () => set({ messages: [], streamingContent: "", isStreaming: false, streamingState: 'idle' }),

  setMessages: (messages) => set({ messages }),
}));

export function compressHistory(messages: ChatMessage[], maxRounds: number = 20): ChatMessage[] {
  if (messages.length <= maxRounds * 2) return messages;
  const keepCount = maxRounds * 2;
  const toCompress = messages.slice(0, messages.length - keepCount);
  const summary: ChatMessage = {
    id: `summary-${Date.now()}`,
    role: "system",
    content: `[历史摘要] 之前的对话涉及: ${summarizeTopics(toCompress)}`,
    images: [],
    timestamp: toCompress[toCompress.length - 1]?.timestamp ?? new Date().toISOString(),
  };
  return [summary, ...messages.slice(messages.length - keepCount)];
}

function summarizeTopics(messages: ChatMessage[]): string {
  const userMessages = messages.filter(m => m.role === "user").map(m => m.content);
  return userMessages.slice(-5).join("；");
}
