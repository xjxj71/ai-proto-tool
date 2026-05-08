import { GripVertical } from "lucide-react";
import type { ComponentTemplate } from "@/stores/componentStore";

interface ComponentCardProps {
  template: ComponentTemplate;
  onDragStart?: (template: ComponentTemplate) => void;
  onClick?: (template: ComponentTemplate) => void;
}

export function ComponentCard({ template, onDragStart, onClick }: ComponentCardProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart?.(template)}
      onClick={() => onClick?.(template)}
      className="group flex items-center gap-2 px-2 py-1.5 bg-bg-surface border border-border rounded hover:border-accent cursor-pointer transition-colors"
    >
      <GripVertical size={12} className="text-text-muted shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-text-primary truncate">{template.name}</p>
        <p className="text-[10px] text-text-muted truncate">
          {template.tags.slice(0, 3).join(" · ")}
        </p>
      </div>
    </div>
  );
}
