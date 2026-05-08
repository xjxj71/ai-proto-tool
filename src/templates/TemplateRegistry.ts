import { BUILT_IN_TEMPLATE_FACTORIES, getBuiltInTemplatesForStore } from "./templates";
import type { ComponentTemplate } from "@/stores/componentStore";
import { useComponentStore } from "@/stores/componentStore";
import type { Canvas } from "fabric";

export function initializeBuiltInTemplates(): ComponentTemplate[] {
  return getBuiltInTemplatesForStore().map((template) => ({
    ...template,
    id: `built-in-${template.name}`,
  }));
}

export function applyTemplateToCanvas(templateName: string, canvas: Canvas): void {
  const factory = BUILT_IN_TEMPLATE_FACTORIES.find((f) => f.name === templateName);
  if (!factory) {
    return;
  }
  factory.create(canvas);
  canvas.renderAll();
}

export function getFilteredTemplates(): ComponentTemplate[] {
  const { builtInComponents, customComponents, searchQuery } = useComponentStore.getState();
  const all = [...builtInComponents, ...customComponents];

  if (!searchQuery.trim()) return all;

  const query = searchQuery.toLowerCase();
  return all.filter(
    (t) =>
      t.name.toLowerCase().includes(query) ||
      t.tags.some((tag) => tag.toLowerCase().includes(query)),
  );
}
