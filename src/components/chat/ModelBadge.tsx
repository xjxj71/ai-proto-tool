import { useModelStore } from "@/stores/modelStore";

interface ModelBadgeProps {
  type: "text" | "vision";
}

export function ModelBadge({ type }: ModelBadgeProps) {
  const getDefaultModel = useModelStore((s) =>
    type === "text" ? s.getDefaultTextModel : s.getDefaultVisionModel
  );
  const model = getDefaultModel();

  if (!model) return null;

  return (
    <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">
      {model.name}
    </span>
  );
}
