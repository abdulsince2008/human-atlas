import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class FirebaseErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    let parsedMessage = error.message || 'An unexpected application error occurred.';
    try {
      const parsed = JSON.parse(parsedMessage) as { error?: string; operationType?: string; path?: string };
      if (parsed && typeof parsed.error === 'string') {
        parsedMessage = `${parsed.error} (${parsed.operationType ?? 'operation'} on ${parsed.path ?? 'resource'})`;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, message: parsedMessage };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Application ErrorBoundary caught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto my-8 max-w-xl rounded-xl border border-amber-300 bg-amber-50 p-6 text-slate-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={20} />
            <div>
              <h2 className="text-base font-bold">Cloud Sync or Session Error</h2>
              <p className="mt-1 text-sm text-slate-700">
                A cloud database operation could not be completed. Your local study progress remains safely stored in your browser.
              </p>
              <p className="mt-2 rounded bg-white/80 px-3 py-2 font-mono text-xs text-slate-700">
                {this.state.message}
              </p>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, message: '' })}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
              >
                <RotateCcw size={13} />
                <span>Return to Workspace</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
