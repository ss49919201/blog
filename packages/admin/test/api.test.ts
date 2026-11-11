import * as v from "valibot";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { fetchPost, fetchPosts, savePost } from "../src/api/posts";
import {
  PostIdSchema,
  PostVersionSchema,
  type Post,
  type PostContent,
} from "../src/types/post";
import { app } from "../worker/index";
import { createTestDb } from "./d1";
import { contentOf, unwrap } from "./fixture";

let db: D1Database;
let dispose: () => Promise<void> = async () => {};

beforeEach(async () => {
  const created = await createTestDb();
  db = created.db;
  dispose = created.dispose;
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) =>
    app.request(input, init, { DB: db }),
  );
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await dispose();
});

test("PUT saves every content field and returns the next version", async () => {
  const base = await readPost("flexbox-layout");
  const content = contentOf(base, {
    slug: "flexbox-notes",
    title: "Flexboxのメモを更新",
    body: "gap で余白をそろえる。",
    status: "draft",
    updatedAt: "2026-11-02",
  });
  const saved = unwrap(await savePost(base, content));
  expect(saved).toEqual({ id: base.id, version: version(2), content });
  expect(await readPost("flexbox-layout")).toEqual(saved);
});

test("PUT without version is 400 and the row is unchanged", async () => {
  const before = await readPost("hello-world");
  const response = await app.request(
    "/api/posts/hello-world",
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: before.content }),
    },
    { DB: db },
  );
  expect(response.status).toBe(400);
  const body: unknown = await response.json();
  expect(isRecord(body) && body.error).toBe("InvalidRequest");
  expect(await readPost("hello-world")).toEqual(before);
});

test("PUT with content.id is 400 and the id stays immutable", async () => {
  const before = await readPost("hello-world");
  const response = await app.request(
    "/api/posts/hello-world",
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        version: before.version,
        content: { ...before.content, id: "other-id" },
      }),
    },
    { DB: db },
  );
  expect(response.status).toBe(400);
  expect(await readPost("hello-world")).toEqual(before);
});

test("PUT with a calendar-invalid date is 400 and the row is unchanged", async () => {
  const before = await readPost("hello-world");
  const response = await app.request(
    "/api/posts/hello-world",
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        version: before.version,
        content: { ...before.content, updatedAt: "2026-02-31" },
      }),
    },
    { DB: db },
  );
  expect(response.status).toBe(400);
  expect(await readPost("hello-world")).toEqual(before);
});

test("PUT with another post's slug is 422 SlugTaken and the row is unchanged", async () => {
  const before = await readPost("hello-world");
  const other = await readPost("html-css-notes");
  const response = await app.request(
    "/api/posts/hello-world",
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        version: before.version,
        content: { ...before.content, slug: other.content.slug },
      }),
    },
    { DB: db },
  );
  expect(response.status).toBe(422);
  expect(await response.json()).toEqual({
    error: "SlugTaken",
    message: "そのスラッグは他の記事で既に使われています。",
  });
  const taken = await savePost(before, contentOf(before, { slug: other.content.slug }));
  expect(taken.isErr()).toBe(true);
  if (taken.isOk()) return;
  expect(taken.error).toEqual({
    type: "SlugTaken",
    message: "そのスラッグは他の記事で既に使われています。",
  });
  expect(await readPost("hello-world")).toEqual(before);
});

test("the second savePost from the same base gets Conflict with the first tab's post", async () => {
  const base = await readPost("hello-world");
  const saved = unwrap(await savePost(base, contentOf(base, { title: "タブ1" })));
  const conflict = await savePost(base, contentOf(base, { title: "タブ2" }));
  expect(conflict.isErr()).toBe(true);
  if (conflict.isOk()) return;
  expect(conflict.error).toEqual({ type: "Conflict", latest: saved });
  expect(await readPost("hello-world")).toEqual(saved);
});

test("fetchPost of an unknown id is NotFound", async () => {
  const result = await fetchPost(v.parse(PostIdSchema, "missing-post"));
  expect(result.isErr()).toBe(true);
  if (result.isOk()) return;
  expect(result.error).toEqual({ type: "NotFound" });
});

test("unknown API routes are 404", async () => {
  const response = await app.request("/api/missing", {}, { DB: db });
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "NotFound" });
});

test("fetchPosts returns the seeded posts newest update first", async () => {
  const posts = unwrap(await fetchPosts());
  expect(posts.map((post) => post.id)).toEqual(["html-css-notes", "hello-world", "flexbox-layout"]);
  const hello = posts.find((post) => post.id === "hello-world");
  expect(hello?.content.title).toBe("はじめてのブログ記事");
  expect(hello?.content.body.startsWith("ブログを始めました。")).toBe(true);
  expect(hello?.version).toEqual(version(1));
});

async function readPost(id: string): Promise<Post> {
  return unwrap(await fetchPost(v.parse(PostIdSchema, id)));
}

function version(value: number): Post["version"] {
  return v.parse(PostVersionSchema, value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function compileTimeSave(post: Post, content: PostContent): void {
  const saveFromLoadedPost = () => savePost(post, content);
  void saveFromLoadedPost;

  // @ts-expect-error savePost needs a parsed Post, not a hand-built { id, version }
  const saveFromLiteral = () => savePost({ id: "hello-world", version: 1 }, content);
  void saveFromLiteral;

  // @ts-expect-error content cannot carry an id; only parsed PostContent is accepted
  const saveWithRawContent = () => savePost(post, { ...post.content, id: "other" });
  void saveWithRawContent;
}

void compileTimeSave;
