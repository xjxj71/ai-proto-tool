import { useState } from "react";
import { Search } from "lucide-react";
import { useComponentStore } from "@/stores/componentStore";
import { ComponentCard } from "./ComponentCard";
import { getFilteredTemplates } from "@/templates/TemplateRegistry";

export function ComponentPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const searchQuery = useComponentStore((s) => s.searchQuery);
  const setSearchQuery = useComponentStore((s) => s.setSearchQuery);
  const builtInComponents = useComponentStore((s) => s.builtInComponents);

  const templates = getFilteredTemplates();

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        <span>组件库 ({templates.length})</span>
        <span>{collapsed ? "+" : "-"}</span>
      </button>
      {!collapsed && (
        <div className="px-2 pb-2 space-y-1">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索组件..."
              className="w-full pl-6 pr-2 py-1 text-xs bg-bg-primary border border-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {templates.map((t) => (
              <ComponentCard key={t.id} template={t} />
            ))}
          </div>
          {builtInComponents.length === 0 && (
            <p className="text-[10px] text-text-muted text-center py-1">加载中...</p>
          )}
        </div>
      )}
    </div>
  );
}
