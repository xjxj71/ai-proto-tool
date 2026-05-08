import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-bg-primary flex items-center justify-center">
          <div className="text-center max-w-md">
            <h2 className="text-xl text-text-primary mb-2">出了点问题</h2>
            <p className="text-sm text-text-muted mb-4">
              {this.state.error?.message ?? "未知错误"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
