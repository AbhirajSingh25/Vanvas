"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { reportError } from "@/lib/monitoring";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportError(error, {
      feature_name: "react_render_tree",
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-2xl p-8 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#E5ECE9] text-[#173B32] flex items-center justify-center mx-auto mb-4 font-serif text-xl font-bold">
              V
            </div>
            <h2 className="font-serif text-2xl font-semibold text-[var(--foreground)] mb-2">
              Something went off trail
            </h2>
            <p className="text-[var(--foreground-muted)] text-sm mb-6 leading-relaxed">
              We encountered an unexpected bump in the journey. Your saved trips and offline packs remain safe.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-4 rounded-xl bg-[#173B32] text-[#FAF7F0] font-medium text-sm hover:bg-[#102C26] transition-colors"
              >
                Reload & Resume Trail
              </button>
              <a
                href="/support"
                className="text-xs text-[var(--foreground-muted)] hover:text-[#B65E3C] transition-colors"
              >
                Report issue to VANVAS Support
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
