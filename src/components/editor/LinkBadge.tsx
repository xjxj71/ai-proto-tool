import { Link } from "lucide-react";

interface LinkBadgeProps {
  label: string;
}

export function LinkBadge({ label }: LinkBadgeProps) {
  return (
    <div className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-accent text-white text-[10px] px-1 py-0.5 rounded-sm pointer-events-none z-10">
      <Link size={8} />
      <span>{label}</span>
    </div>
  );
}
