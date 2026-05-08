import * as Dialog from "@radix-ui/react-dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "确认",
  cancelLabel = "取消",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-surface rounded-lg p-6 w-[380px] border border-border">
          <Dialog.Title className="text-base font-medium text-text-primary mb-2">
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-text-secondary mb-6">
            {message}
          </Dialog.Description>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                variant === "danger"
                  ? "bg-danger text-white hover:bg-red-600"
                  : "bg-accent text-white hover:bg-accent-hover"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
