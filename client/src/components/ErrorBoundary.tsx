import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("Uncaught error:", error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                    gap: "1rem",
                    fontFamily: "sans-serif",
                    color: "var(--text, #333)"
                }}>
                    <h2>Something went wrong.</h2>
                    <p style={{ color: "#888", maxWidth: 400, textAlign: "center" }}>
                        {this.state.error?.message}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: "0.5rem 1.5rem",
                            cursor: "pointer",
                            background: "var(--anchor, #64bb5d)",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            fontSize: "1rem"
                        }}
                    >
                        Reload page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
