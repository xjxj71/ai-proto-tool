import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/stores/chatStore";
import { useProjectStore } from "@/stores/projectStore";
import { useUiStore } from "@/stores/uiStore";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ModelBadge } from "@/components/chat/ModelBadge";
import { SkillBadge } from "@/components/chat/SkillBadge";
import { useStreamingChat } from "@/hooks/useStreamingChat";

export function ChatPanel() {
  const { t } = useTranslation();
  const currentPageId = useUiStore((s) => s.currentPageId);
  const currentProject = useProjectStore((s) => s.currentProject);
  const projectId = currentProject?.id ?? "";

  const { send, cancel, isLoading } = useStreamingChat({
    projectId,
    pageId: currentPageId,
  });

  useEffect(() => {
    const loadHistory = async () => {
      if (!currentPageId || !projectId) return;
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const json = await invoke<string>("load_chat_history", {
          projectId,
          pageId: currentPageId,
        });
        const history = JSON.parse(json);
        if (history.messages?.length > 0) {
          useChatStore.getState().setMessages(history.messages);
        }
      } catch {
        // No history file yet, that's OK
      }
    };
    loadHistory();
  }, [currentPageId]);

  return (
    <div className="w-[300px] bg-bg-secondary border-l border-border flex flex-col">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{t("chat.title")}</span>
        <div className="flex items-center gap-1">
          <SkillBadge />
          <ModelBadge type="text" />
        </div>
      </div>

      <ChatMessageList />

      {isLoading && (
        <div className="px-3 py-1 text-xs text-text-tertiary border-t border-border">
          {t("chat.generating")}
        </div>
      )}

      <ChatInput
        onSend={send}
        onCancel={cancel}
        isLoading={isLoading}
      />
    </div>
  );
}
