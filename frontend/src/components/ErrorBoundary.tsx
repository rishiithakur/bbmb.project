import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronRight, ChevronDown } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('Uncaught error in boundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 md:p-12 font-sans selection:bg-red-500/10 selection:text-red-700">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-200 overflow-hidden">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-red-600 to-rose-500 px-6 py-8 text-white flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <AlertTriangle size={32} className="text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">System Recovery</h1>
                <p className="text-red-100 text-sm mt-0.5 font-medium">A temporary rendering anomaly was safely intercepted.</p>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-800">What happened?</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  The BBMC Dam Monitoring System caught an unexpected exception during view rendering. 
                  Don't worry — your telemetry data and current session are safe.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={this.handleReload}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <RefreshCw size={15} />
                  Reload Page
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-all active:scale-95 cursor-pointer"
                >
                  <Home size={15} />
                  Go to Main Workspace
                </button>
              </div>

              {/* Collapsible details for devs/operators */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 transition-all duration-300">
                <button
                  onClick={() => this.setState(prev => ({ showDetails: !prev }))}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors border-b border-transparent"
                >
                  <span className="flex items-center gap-1.5 uppercase tracking-wider font-bold">
                    {this.state.showDetails ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    Diagnostic Telemetry Log
                  </span>
                  <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold border border-red-100">
                    FATAL_RENDER_ERR
                  </span>
                </button>

                {this.state.showDetails && (
                  <div className="p-4 space-y-3 font-mono text-[11px] text-slate-700 leading-normal border-t border-slate-200 select-text overflow-x-auto max-h-64 scrollbar-thin">
                    <div className="bg-red-50/50 p-3 rounded-lg border border-red-100/50">
                      <span className="font-bold text-red-600">Exception: </span>
                      {this.state.error?.toString() || 'Unknown runtime render error.'}
                    </div>
                    {this.state.errorInfo?.componentStack && (
                      <div className="text-slate-500 whitespace-pre font-mono leading-relaxed bg-white p-3 rounded-lg border">
                        {this.state.errorInfo.componentStack}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold text-slate-400 tracking-wide uppercase">
              <span>BBMC Dam Monitoring System v2.1</span>
              <span>Secure Degradation Engine</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
