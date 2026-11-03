import { type ReactNode, useEffect, useState } from "react";
import { isObservable, type Observable } from "rxjs";

type LoadInput<T> = Observable<T> | Promise<T> | (() => Observable<T> | Promise<T>);

function resolveLoad<T>(load: LoadInput<T>): Observable<T> | Promise<T> {
  return typeof load === "function" ? load() : load;
}

type LoadState<T> =
  | { kind: "loading" }
  | { kind: "ready"; data: T }
  | { kind: "error"; error: Error };

/**
 * Local stand-in for argo-ui `DataLoader` (re-exported in Argo CD from
 * ui/src/app/shared/components/index.ts).
 */
export function DataLoader<T>(props: {
  load: LoadInput<T>;
  children: (data: T) => ReactNode;
  loadingRenderer?: () => ReactNode;
  errorRenderer?: (error: Error) => ReactNode;
}) {
  const [state, setState] = useState<LoadState<T>>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });

    const resolved = resolveLoad(props.load);

    if (isObservable(resolved)) {
      const subscription = resolved.subscribe({
        next: (data) => {
          if (!cancelled) {
            setState({ kind: "ready", data });
          }
        },
        error: (err: unknown) => {
          if (!cancelled) {
            setState({
              kind: "error",
              error: err instanceof Error ? err : new Error(String(err)),
            });
          }
        },
      });
      return () => {
        cancelled = true;
        subscription.unsubscribe();
      };
    }

    void resolved
      .then((data) => {
        if (!cancelled) {
          setState({ kind: "ready", data });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            kind: "error",
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [props.load]);

  if (state.kind === "loading") {
    return props.loadingRenderer?.() ?? <p className="data-loader__loading">読み込み中…</p>;
  }
  if (state.kind === "error") {
    return (
      props.errorRenderer?.(state.error) ?? (
        <p className="data-loader__error" role="alert">
          {state.error.message}
        </p>
      )
    );
  }
  return props.children(state.data);
}
