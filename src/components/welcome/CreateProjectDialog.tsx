import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import { CANVAS_PRESETS } from "@/types";

interface CreateProjectFormData {
  name: string;
  description: string;
  canvasPreset: string;
}

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectFormData) => void;
}

export function CreateProjectDialog({ open, onClose, onSubmit }: CreateProjectDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [canvasPreset, setCanvasPreset] = useState(CANVAS_PRESETS[0].name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim(), canvasPreset });
    setName("");
    setDescription("");
    setCanvasPreset(CANVAS_PRESETS[0].name);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-surface rounded-lg p-6 w-[480px] border border-border">
          <Dialog.Title className="text-lg font-medium text-text-primary mb-4">
            {t("welcome.createProject")}
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="project-name" className="block text-sm text-text-secondary mb-1">
                {t("welcome.projectName")}
              </label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="project-desc" className="block text-sm text-text-secondary mb-1">
                {t("welcome.projectDescription")}
              </label>
              <textarea
                id="project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>
            <div>
              <label htmlFor="canvas-preset" className="block text-sm text-text-secondary mb-1">
                {t("welcome.canvasSize")}
              </label>
              <select
                id="canvas-preset"
                value={canvasPreset}
                onChange={(e) => setCanvasPreset(e.target.value)}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent"
              >
                {CANVAS_PRESETS.map((preset) => (
                  <option key={preset.name} value={preset.name}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                {t("welcome.cancel")}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-accent text-white rounded hover:bg-accent-hover transition-colors"
              >
                {t("welcome.createProject")}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
