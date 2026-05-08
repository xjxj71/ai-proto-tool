interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 20, className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`animate-spin ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <circle
          cx="12" cy="12" r="10"
          stroke="currentColor"
          strokeWidth="2"
          className="text-border"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-accent"
        />
      </svg>
    </div>
  );
}
