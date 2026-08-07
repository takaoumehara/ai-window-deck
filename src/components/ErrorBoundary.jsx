import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AI Window Deck ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col items-center justify-center">
          <div className="max-w-md w-full p-6 rounded-2xl border border-red-800 bg-red-950/30 flex flex-col items-center gap-4 text-center">
            <h2 className="text-lg font-bold text-red-400">エラーが発生しました</h2>
            <p className="text-xs text-zinc-300 font-mono bg-zinc-900 p-3 rounded border border-zinc-800 w-full text-left overflow-x-auto">
              {String(this.state.error?.message || this.state.error)}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              アプリを再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
