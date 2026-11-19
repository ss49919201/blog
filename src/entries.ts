import type { UUID } from "crypto";

export interface Entry {
  id: UUID;
  title: string;
  body: string;
  publishedAt: Date;
}

export const entries: Entry[] = [
  {
    id: "d290f1ee-6c54-4b01-90e6-d701748f0851" as UUID,
    title: "Hono を使ってみた",
    body: "Hono は軽量な Web フレームワークです。",
    publishedAt: new Date("2026-01-10"),
  },
  {
    id: "e9c1a9c0-8b3f-4e7a-9c3a-1a2b3c4d5e6f" as UUID,
    title: "Cloudflare Workers で Blog を作る",
    body: "Cloudflare Workers と Hono でシンプルなブログを構築します。",
    publishedAt: new Date("2026-02-15"),
  },
];
