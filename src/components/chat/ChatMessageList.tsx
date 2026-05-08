import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/stores/chatStore";
import { ChatMessageItem } from "./ChatMessageItem";

export function ChatMessageList() {
  const { t } = useTranslation();
  const messages = useChatStore((s) => s.messages);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm p-4">
        {t("chat.noMessages")}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.map((msg) => (
        <ChatMessageItem key={msg.id} message={msg} />
      ))}
      {isStreaming && streamingContent && (
        <ChatMessageItem
          message={{
            id: "streaming",
            role: "assistant",
            content: streamingContent,
            images: [],
            timestamp: new Date().toISOString(),
          }}
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
