/**
 * Thin HTTP helpers (Argo CD: ui/src/app/shared/services/requests.ts uses superagent + SSE).
 * This app only needs same-origin GET for static JSON.
 */

let baseHref = "/";

export function setBaseHref(val: string): void {
  baseHref = val.endsWith("/") ? val : `${val}/`;
}

export function toAbsURL(path: string): string {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${baseHref}${normalized}`;
}

export async function getJson<T>(path: string): Promise<T> {
  const url = toAbsURL(path);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GET ${url} failed: HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}
