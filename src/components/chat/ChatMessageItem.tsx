import { useTranslation } from "react-i18next";
import { Bot, User, CheckCircle } from "lucide-react";
import type { ChatMessage } from "@/types";

interface ChatMessageItemProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const { t } = useTranslation();

  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-2 px-3 py-2 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
          isUser ? "bg-accent" : "bg-bg-tertiary"
        }`}
      >
        {isUser ? (
          <User size={12} className="text-white" />
        ) : (
          <Bot size={12} className="text-text-primary" />
        )}
      </div>

      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
            isUser
              ? "bg-accent text-white"
              : "bg-bg-tertiary text-text-primary"
          }`}
        >
          {message.content}
        </div>

        <div className="flex items-center gap-1 text-xs text-text-tertiary">
          {message.canvasUpdated && (
            <span className="flex items-center gap-0.5">
              <CheckCircle size={10} />
              {t("chat.canvasUpdated")}
            </span>
          )}
          {message.skillUsed && (
            <span className="bg-accent/10 text-accent px-1 rounded">
              {message.skillUsed}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
