// ブログの管理画面。記事の CRUD を行う。
// 認証は Cloudflare Access で前段にかけるため、アプリケーションコードでは行わない。
import { Hono } from "hono";
import { raw } from "hono/html";
import { styles } from "./style";

const app = new Hono<{ Bindings: CloudflareBindings }>();

interface Post {
  id: string;
  title: string;
  body: string;
  // 'YYYY-MM-DD'
  publishedAt: string;
  updatedAt: string;
}

type PostInput = Pick<Post, "title" | "body" | "publishedAt">;

const selectPost =
  "SELECT id, title, body, published_at AS publishedAt, updated_at AS updatedAt FROM posts";

const todayJst = () =>
  new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

// フォームの値を検証する。エラーがあればメッセージの配列を返す。
const parseInput = (form: Record<string, unknown>): { input: PostInput; errors: string[] } => {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const input: PostInput = {
    title: str(form.title).trim(),
    // 本文は前後の空白も意味を持ちうるので改行コードの正規化だけ行う
    body: str(form.body).replaceAll("\r\n", "\n"),
    publishedAt: str(form.publishedAt),
  };
  const errors: string[] = [];
  if (input.title === "") errors.push("タイトルを入力してください");
  if (input.body.trim() === "") errors.push("本文を入力してください");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.publishedAt)) errors.push("公開日を入力してください");
  return { input, errors };
};

const Layout = (props: { title: string; children?: unknown }) => (
  <html lang="ja">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{props.title} | Blog Admin</title>
      <style>{raw(styles)}</style>
    </head>
    <body>
      <header>
        <a href="/">Blog Admin</a>
      </header>
      <main>{props.children}</main>
    </body>
  </html>
);

const PostList = ({ posts }: { posts: Post[] }) => (
  <Layout title="記事一覧">
    <div class="heading">
      <h1>記事一覧</h1>
      <a class="button" href="/posts/new">新規作成</a>
    </div>
    <table>
      <thead>
        <tr>
          <th scope="col">公開日</th>
          <th scope="col">タイトル</th>
          <th scope="col">更新日時</th>
        </tr>
      </thead>
      <tbody>
        {posts.map((post) => (
          <tr>
            <td>{post.publishedAt}</td>
            <td>
              <a href={`/posts/${post.id}/edit`}>{post.title}</a>
            </td>
            <td>{post.updatedAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {posts.length === 0 && <p>記事はまだありません。</p>}
  </Layout>
);

const PostForm = (props: { action: string; input: PostInput; errors?: string[] }) => (
  <form method="post" action={props.action}>
    {props.errors && props.errors.length > 0 && (
      <ul class="errors" role="alert">
        {props.errors.map((e) => (
          <li>{e}</li>
        ))}
      </ul>
    )}
    <label>
      タイトル
      <input name="title" value={props.input.title} required />
    </label>
    <label>
      公開日
      <input type="date" name="publishedAt" value={props.input.publishedAt} required />
    </label>
    <label>
      本文
      <textarea name="body" rows={20} required>
        {props.input.body}
      </textarea>
    </label>
    <button type="submit">保存</button>
  </form>
);

const NewPost = (props: { input: PostInput; errors?: string[] }) => (
  <Layout title="新規作成">
    <h1>新規作成</h1>
    <PostForm action="/posts" {...props} />
    <p>
      <a href="/">← 一覧に戻る</a>
    </p>
  </Layout>
);

const EditPost = (props: { id: string; input: PostInput; errors?: string[]; saved?: boolean }) => (
  <Layout title="編集">
    <h1>編集</h1>
    {props.saved && (
      <p class="notice" role="status">
        保存しました
      </p>
    )}
    <PostForm action={`/posts/${props.id}`} input={props.input} errors={props.errors} />
    <form
      method="post"
      action={`/posts/${props.id}/delete`}
      onsubmit="return confirm('この記事を削除しますか？')"
    >
      <button type="submit" class="danger">
        削除
      </button>
    </form>
    <p>
      <a href="/">← 一覧に戻る</a>
    </p>
  </Layout>
);

app.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `${selectPost} ORDER BY published_at DESC, id`,
  ).all<Post>();
  return c.html(<PostList posts={results} />);
});

app.get("/posts/new", (c) =>
  c.html(<NewPost input={{ title: "", body: "", publishedAt: todayJst() }} />),
);

app.post("/posts", async (c) => {
  const { input, errors } = parseInput(await c.req.parseBody());
  if (errors.length > 0) {
    return c.html(<NewPost input={input} errors={errors} />, 400);
  }
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    "INSERT INTO posts (id, title, body, published_at) VALUES (?, ?, ?, ?)",
  )
    .bind(id, input.title, input.body, input.publishedAt)
    .run();
  return c.redirect(`/posts/${id}/edit?saved=1`, 303);
});

app.get("/posts/:id/edit", async (c) => {
  const id = c.req.param("id");
  const post = await c.env.DB.prepare(`${selectPost} WHERE id = ?`).bind(id).first<Post>();
  if (!post) {
    return c.notFound();
  }
  return c.html(<EditPost id={id} input={post} saved={c.req.query("saved") === "1"} />);
});

app.post("/posts/:id", async (c) => {
  const id = c.req.param("id");
  const { input, errors } = parseInput(await c.req.parseBody());
  if (errors.length > 0) {
    return c.html(<EditPost id={id} input={input} errors={errors} />, 400);
  }
  const { meta } = await c.env.DB.prepare(
    `UPDATE posts
       SET title = ?, body = ?, published_at = ?,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?`,
  )
    .bind(input.title, input.body, input.publishedAt, id)
    .run();
  if (meta.changes === 0) {
    return c.notFound();
  }
  return c.redirect(`/posts/${id}/edit?saved=1`, 303);
});

app.post("/posts/:id/delete", async (c) => {
  await c.env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(c.req.param("id")).run();
  return c.redirect("/", 303);
});

export default app;
