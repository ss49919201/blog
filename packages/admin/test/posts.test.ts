import * as v from "valibot";
import { afterEach, beforeEach, expect, test } from "vitest";
import {
  CONTENT_COLUMN,
  PostIdSchema,
  PostVersionSchema,
  type PostContent,
  type PostField,
  type PostId,
  type PostVersion,
  type UpdatePostBody,
} from "../src/types/post";
import { getPost, updatePost, type UpdatePostCommand } from "../worker/index";
import { createTestDb } from "./d1";
import { contentOf, seededPost, unwrap } from "./fixture";

let db: D1Database;
let dispose: () => Promise<void> = async () => {};

beforeEach(async () => {
  const created = await createTestDb();
  db = created.db;
  dispose = created.dispose;
});

afterEach(async () => {
  await dispose();
});

test("saves every content field and bumps version by one", async () => {
  const post = await seededPost(db, "hello-world");
  const content = contentOf(post, {
    slug: "hello-revised",
    title: "書き直したタイトル",
    body: "本文をすべて更新した。",
    status: "draft",
    updatedAt: "2026-11-01",
  });
  const saved = unwrap(
    await updatePost(db, {
      id: post.id,
      expectedVersion: post.version,
      content,
    }),
  );
  expect(saved).toEqual({ id: post.id, version: version(2), content });
  expect(unwrap(await getPost(db, post.id))).toEqual(saved);
});

test("rejects a stale version with Conflict even when the submitted content matches the row", async () => {
  const post = await seededPost(db, "hello-world");
  const winner = unwrap(
    await updatePost(db, {
      id: post.id,
      expectedVersion: post.version,
      content: contentOf(post, { title: "先に保存されたタイトル", body: "先に保存された本文" }),
    }),
  );
  const stale = await updatePost(db, {
    id: post.id,
    expectedVersion: post.version,
    content: winner.content,
  });
  expect(stale.isErr()).toBe(true);
  if (stale.isOk()) return;
  expect(stale.error).toEqual({ type: "Conflict", latest: winner });
  expect(unwrap(await getPost(db, post.id))).toEqual(winner);
});

test("lets exactly one of two concurrent saves from the same version win", async () => {
  const post = await seededPost(db, "hello-world");
  const left = contentOf(post, { title: "左のタブ", body: "左が保存した本文" });
  const right = contentOf(post, { title: "右のタブ", body: "右が保存した本文" });
  const [leftResult, rightResult] = await Promise.all([
    updatePost(db, { id: post.id, expectedVersion: post.version, content: left }),
    updatePost(db, { id: post.id, expectedVersion: post.version, content: right }),
  ]);
  const stored = unwrap(await getPost(db, post.id));
  expect(stored.version).toEqual(version(2));
  if (leftResult.isOk() && rightResult.isErr()) {
    expect(leftResult.value).toEqual(stored);
    expect(rightResult.error).toEqual({ type: "Conflict", latest: stored });
    return;
  }
  if (rightResult.isOk() && leftResult.isErr()) {
    expect(rightResult.value).toEqual(stored);
    expect(leftResult.error).toEqual({ type: "Conflict", latest: stored });
    return;
  }
  throw new Error("expected one save to win and the other to conflict");
});

test("returns NotFound for an unknown id", async () => {
  const post = await seededPost(db, "hello-world");
  const missingId = postId("missing-post");
  const missing = await updatePost(db, {
    id: missingId,
    expectedVersion: post.version,
    content: post.content,
  });
  expect(missing.isErr()).toBe(true);
  if (missing.isOk()) return;
  expect(missing.error).toEqual({ type: "NotFound", id: missingId });
});

test("returns SlugTaken when the slug belongs to another post and leaves the row unchanged", async () => {
  const post = await seededPost(db, "hello-world");
  const other = await seededPost(db, "html-css-notes");
  const taken = await updatePost(db, {
    id: post.id,
    expectedVersion: post.version,
    content: contentOf(post, { slug: other.content.slug }),
  });
  expect(taken.isErr()).toBe(true);
  if (taken.isOk()) return;
  expect(taken.error).toEqual({ type: "SlugTaken", slug: other.content.slug });
  expect(unwrap(await getPost(db, post.id))).toEqual(post);
});

test("every posts column except id and version is a content column", async () => {
  const info = await db.prepare("SELECT name FROM pragma_table_info('posts')").all();
  const names = info.results.map((row) => {
    const name = row.name;
    if (typeof name !== "string") throw new Error("pragma_table_info row is missing name");
    return name;
  });
  expect(names.slice().sort()).toEqual(
    ["id", "version", ...Object.values(CONTENT_COLUMN)].slice().sort(),
  );
});

function version(value: number): PostVersion {
  return v.parse(PostVersionSchema, value);
}

function postId(value: string): PostId {
  return v.parse(PostIdSchema, value);
}

function compileTimeGuarantees(id: PostId, lock: PostVersion, content: PostContent): void {
  const commandFromParsedParts: UpdatePostCommand = {
    id,
    expectedVersion: lock,
    content,
  };
  void commandFromParsedParts;

  // @ts-expect-error
  const commandWithoutVersion: UpdatePostCommand = { id, content };
  void commandWithoutVersion;

  // @ts-expect-error
  const commandWithGuessedVersion: UpdatePostCommand = { id, expectedVersion: 1, content };
  void commandWithGuessedVersion;

  // @ts-expect-error
  const bodyWithoutVersion: UpdatePostBody = { content };
  void bodyWithoutVersion;

  // @ts-expect-error
  const incompleteColumnMap = { title: "title", body: "body", status: "status" } satisfies Record<PostField, string>;
  void incompleteColumnMap;
}

void compileTimeGuarantees;
