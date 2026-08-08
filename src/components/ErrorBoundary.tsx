import { Component, ReactNode } from "react";
import { Copy, RotateCcw, TriangleAlert } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  componentStack?: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ componentStack: errorInfo?.componentStack });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Rendered on-screen (not just console) so failures on a phone,
      // where there is no devtools, are still readable and copyable.
      const details = [
        this.state.error?.name && `${this.state.error.name}: ${this.state.error.message}`,
        this.state.error?.stack,
        this.state.componentStack && `--- component stack ---${this.state.componentStack}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      return (
        <div className="p-6 md:p-8 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <TriangleAlert className="w-5 h-5 text-destructive" />
            <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          {details && (
            <pre className="mb-4 max-h-72 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-left font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-words select-all">
              {details}
            </pre>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigator.clipboard?.writeText(details)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition"
            >
              <Copy className="w-4 h-4" />
              Copy details
            </button>
            <button
              onClick={() =>
                this.setState({ hasError: false, error: undefined, componentStack: undefined })
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-primary-foreground text-sm font-medium hover:brightness-95 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;




