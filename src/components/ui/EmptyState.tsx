import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-text-muted">
      {icon && <div className="mb-2">{icon}</div>}
      <p className="text-xs">{message}</p>
    </div>
  );
}
