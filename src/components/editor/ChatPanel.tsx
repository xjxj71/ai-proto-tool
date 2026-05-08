import { useTranslation } from "react-i18next";

export function ChatPanel() {
  const { t } = useTranslation();

  return (
    <div className="w-[300px] bg-bg-secondary border-l border-border flex flex-col">
      <div className="p-3 border-b border-border">
        <span className="text-xs font-medium text-text-secondary">AI 助手</span>
      </div>
      <div className="flex-1 p-3 text-xs text-text-muted">
        <p>AI 对话面板</p>
      </div>
    </div>
  );
}
