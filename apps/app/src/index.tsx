import { Hono } from "hono";
import { raw } from "hono/html";
import { styles } from "./style";

const app = new Hono<{ Bindings: CloudflareBindings }>();

interface Entry {
  id: string;
  title: string;
  body: string;
  // 'YYYY-MM-DD'
  publishedAt: string;
}

const selectEntry = "SELECT id, title, body, published_at AS publishedAt FROM posts";

// 'YYYY-MM-DD' -> 'YYYY/MM/DD'。Date を経由しないので実行環境のタイムゾーンに左右されない。
const formatDate = (d: string) => d.replaceAll("-", "/");

const Layout = (props: { title: string; count?: number; children?: unknown }) => (
  <html lang="ja">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{props.title}</title>
      <style>{raw(styles)}</style>
    </head>
    <body>
      <div class="shell">
        <header class="welcome">
          <a href="/">Blog</a>
        </header>
        <main>{props.children}</main>
      </div>
      <footer>
        <span>~/blog</span>
        {props.count !== undefined && <span>{props.count} entries</span>}
      </footer>
    </body>
  </html>
);

const EntryList = ({ entries }: { entries: Entry[] }) => (
  <Layout title="Blog" count={entries.length}>
    <ul class="entries">
      {entries.map((entry) => (
        <li>
          <a href={`/${entry.id}`}>
            <time datetime={entry.publishedAt}>{formatDate(entry.publishedAt)}</time>
            <span class="title">{entry.title}</span>
          </a>
        </li>
      ))}
    </ul>
  </Layout>
);

const EntryDetail = ({ entry }: { entry: Entry }) => (
  <Layout title={entry.title}>
    <article>
      <header>
        <h1>{entry.title}</h1>
        <time datetime={entry.publishedAt}>{formatDate(entry.publishedAt)}</time>
      </header>
      <div class="body">
        <p>{entry.body}</p>
      </div>
    </article>
    <p>
      <a class="back" href="/">← 一覧に戻る</a>
    </p>
  </Layout>
);

app.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `${selectEntry} ORDER BY published_at DESC, id`,
  ).all<Entry>();
  return c.html(<EntryList entries={results} />);
});

app.get("/:id", async (c) => {
  const entry = await c.env.DB.prepare(`${selectEntry} WHERE id = ?`)
    .bind(c.req.param("id"))
    .first<Entry>();
  if (!entry) {
    return c.notFound();
  }
  return c.html(<EntryDetail entry={entry} />);
});

export default app;
