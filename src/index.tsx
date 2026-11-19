import { UUID } from "crypto";
import { Hono } from "hono";

const app = new Hono<{ Bindings: CloudflareBindings }>();

interface Entry {
  id: UUID;
  title: string;
  body: string;
  publishedAt: Date;
}

const entries: Entry[] = [
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

const Layout = (props: { title: string; children?: unknown }) => (
  <html lang="ja">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{props.title}</title>
    </head>
    <body>{props.children}</body>
  </html>
);

const EntryList = ({ entries }: { entries: Entry[] }) => (
  <Layout title="Blog">
    <h1>Blog</h1>
    <ul>
      {entries.map((entry) => (
        <li>
          <a href={`/${entry.id}`}>{entry.title}</a>
        </li>
      ))}
    </ul>
  </Layout>
);

const EntryDetail = ({ entry }: { entry: Entry }) => (
  <Layout title={entry.title}>
    <h1>{entry.title}</h1>
    <p>{entry.publishedAt.toLocaleDateString("ja-JP")}</p>
    <p>{entry.body}</p>
    <a href="/">一覧に戻る</a>
  </Layout>
);

app.get("/", (c) => {
  return c.html(<EntryList entries={entries} />);
});

app.get("/:id", (c) => {
  const entry = entries.find((entry) => entry.id === c.req.param("id"));
  if (!entry) {
    return c.notFound();
  }
  return c.html(<EntryDetail entry={entry} />);
});

export default app;
