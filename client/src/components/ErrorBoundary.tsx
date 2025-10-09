import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";

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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary
                  className="cursor-pointer text-sm text-muted-foreground hover:text-foreground mb-2"
                  data-testid="summary-technical-details"
                >
                  Technical details
                </summary>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <Button
              onClick={this.handleReset}
              className="w-full"
              data-testid="button-reset-app"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Return to home
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
