import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

export function PagePanel() {
  const { t } = useTranslation();

  return (
    <div className="w-[200px] bg-bg-secondary border-r border-border flex flex-col">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">页面</span>
        <button className="p-1 text-text-muted hover:text-accent transition-colors">
          <Plus size={14} />
        </button>
      </div>
      <div className="flex-1 p-2 text-xs text-text-muted">
        <p>暂无页面</p>
      </div>
    </div>
  );
}
