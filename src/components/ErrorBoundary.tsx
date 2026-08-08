"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Alert, Button, Card } from "antd";
import { useI18n } from "@/i18n/context";

type ErrorBoundaryState = {
  hasError: boolean;
};

type ErrorBoundaryInnerProps = {
  children: ReactNode;
  title: string;
  reloadLabel: string;
};

class ErrorBoundaryInner extends Component<
  ErrorBoundaryInnerProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <Alert
            type="error"
            showIcon
            message={this.props.title}
            action={
              <Button size="small" onClick={() => window.location.reload()}>
                {this.props.reloadLabel}
              </Button>
            }
          />
        </Card>
      );
    }

    return this.props.children;
  }
}

export default function ErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <ErrorBoundaryInner
      title={t.common.error || "Something went wrong"}
      reloadLabel={t.common.reload || "Reload"}
    >
      {children}
    </ErrorBoundaryInner>
  );
}
