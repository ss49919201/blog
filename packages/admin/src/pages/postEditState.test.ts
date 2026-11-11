import { err, ok } from "neverthrow";
import * as v from "valibot";
import { expect, test } from "vitest";
import { savePost } from "../api/posts";
import { PostContentSchema, PostSchema, type Post, type PostContent } from "../types/post";
import {
  editAlertText,
  editReducer,
  editStatusText,
  initialEditState,
  parsePostForm,
  type EditState,
} from "./postEditState";

const post = v.parse(PostSchema, {
  id: "hello-world",
  version: 1,
  content: {
    slug: "hello-world",
    title: "はじめてのブログ記事",
    body: "本文",
    status: "published",
    updatedAt: "2026-10-28",
  },
});

const editing: EditState = { kind: "editing", post, notice: null };

test("a loaded post becomes editable", () => {
  expect(editReducer(initialEditState, { type: "loadSettled", result: ok(post) })).toEqual(editing);
});

test("a missing post and a failed load are different states", () => {
  expect(
    editReducer(initialEditState, { type: "loadSettled", result: err({ type: "NotFound" }) }),
  ).toEqual({ kind: "missing" });
  expect(
    editReducer(initialEditState, {
      type: "loadSettled",
      result: err({ type: "Failed", cause: "offline" }),
    }),
  ).toEqual({ kind: "loadFailed" });
  expect(editAlertText({ kind: "missing" })).toBe("記事が見つかりません。");
  expect(editAlertText({ kind: "loadFailed" })).toBe("記事の読み込みに失敗しました。");
});

test("conflict reloads the snapshot to latest and keeps the rejected content for display", () => {
  const submitted = withContent({ title: "保存できなかった題", body: "残したい本文" });
  const latest = v.parse(PostSchema, {
    id: "hello-world",
    version: 4,
    content: {
      slug: "hello-world",
      title: "サーバーの題",
      body: "サーバーの本文",
      status: "draft",
      updatedAt: "2026-11-03",
    },
  });
  const saving = editReducer(editing, { type: "submitted", content: submitted });
  const next = editReducer(saving, { type: "saveSettled", result: err({ type: "Conflict", latest }) });
  expect(next).toEqual({
    kind: "editing",
    post: latest,
    notice: { kind: "conflict", rejected: submitted },
  });
  expect(editAlertText(next)).toBe(
    "他の場所でこの記事が更新されたため、保存できませんでした。最新の内容（バージョン 4）を読み込みました。",
  );
});

test("a failed save keeps the same snapshot version, so the form does not remount", () => {
  const submitted = withContent({ title: "未保存" });
  const saving = editReducer(editing, { type: "submitted", content: submitted });
  const next = editReducer(saving, {
    type: "saveSettled",
    result: err({ type: "Failed", cause: "offline" }),
  });
  expect(next).toEqual({ kind: "editing", post, notice: { kind: "failed" } });
  expect(editStatusText(next)).toBe("");
  expect(editAlertText(next)).toBe("保存に失敗しました。時間をおいて再度お試しください。");
});

test("a successful save moves the snapshot to the saved post", () => {
  const submitted = withContent({ title: "保存した題", status: "draft" });
  const saved = v.parse(PostSchema, {
    id: post.id,
    version: 2,
    content: {
      slug: submitted.slug,
      title: submitted.title,
      body: submitted.body,
      status: submitted.status,
      updatedAt: submitted.updatedAt,
    },
  });
  const saving = editReducer(editing, { type: "submitted", content: submitted });
  const next = editReducer(saving, { type: "saveSettled", result: ok(saved) });
  expect(next).toEqual({ kind: "editing", post: saved, notice: { kind: "saved" } });
  expect(editStatusText(next)).toBe("保存しました。");
  expect(editAlertText(next)).toBeNull();
});

test("submitted while saving is ignored", () => {
  const saving = editReducer(editing, { type: "submitted", content: withContent({ title: "1回目" }) });
  const next = editReducer(saving, { type: "submitted", content: withContent({ title: "2回目" }) });
  expect(next).toBe(saving);
});

test("a taken slug keeps the snapshot and shows the server message", () => {
  const submitted = withContent({ slug: "html-css-notes" });
  const saving = editReducer(editing, { type: "submitted", content: submitted });
  const message = "そのスラッグは他の記事で既に使われています。";
  const next = editReducer(saving, {
    type: "saveSettled",
    result: err({ type: "SlugTaken", message }),
  });
  expect(next).toEqual({
    kind: "editing",
    post,
    notice: { kind: "slugTaken", message },
  });
  expect(editAlertText(next)).toBe(message);
});

test("invalid input stays on the same snapshot", () => {
  const next = editReducer(editing, { type: "invalid", message: "タイトルを入力してください。" });
  expect(next).toEqual({
    kind: "editing",
    post,
    notice: { kind: "invalid", message: "タイトルを入力してください。" },
  });
});

test("parsePostForm reads every editable field", () => {
  const parsed = parsePostForm(
    formData({
      slug: "hello-revised",
      title: "書き直した題",
      body: "新しい本文",
      status: "draft",
      updatedAt: "2026-11-01",
    }),
  );
  expect(parsed.isOk()).toBe(true);
  if (parsed.isErr()) return;
  expect(parsed.value).toEqual(
    v.parse(PostContentSchema, {
      slug: "hello-revised",
      title: "書き直した題",
      body: "新しい本文",
      status: "draft",
      updatedAt: "2026-11-01",
    }),
  );
});

test("parsePostForm rejects a FormData with an extra id field", () => {
  const parsed = parsePostForm(
    formData({
      id: "other",
      slug: "hello-world",
      title: "題",
      body: "本文",
      status: "published",
      updatedAt: "2026-10-28",
    }),
  );
  expect(parsed.isErr()).toBe(true);
});

test("parsePostForm rejects a date that is not on the calendar", () => {
  const parsed = parsePostForm(
    formData({
      slug: "hello-world",
      title: "題",
      body: "本文",
      status: "published",
      updatedAt: "2026-02-31",
    }),
  );
  expect(parsed.isErr()).toBe(true);
  if (parsed.isOk()) return;
  expect(parsed.error).toBe("更新日は実在する日付を入力してください。");
});

function withContent(patch: {
  slug?: string;
  title?: string;
  body?: string;
  status?: "draft" | "published";
  updatedAt?: string;
}): PostContent {
  return v.parse(PostContentSchema, {
    slug: patch.slug ?? post.content.slug,
    title: patch.title ?? post.content.title,
    body: patch.body ?? post.content.body,
    status: patch.status ?? post.content.status,
    updatedAt: patch.updatedAt ?? post.content.updatedAt,
  });
}

function formData(values: Record<string, string>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

function compileTimeSave(loaded: Post, content: PostContent): void {
  const saveFromLoadedPost = () => savePost(loaded, content);
  void saveFromLoadedPost;

  // @ts-expect-error savePost needs a parsed Post, not a hand-built { id, version }
  const saveFromLiteral = () => savePost({ id: "hello-world", version: 1 }, content);
  void saveFromLiteral;
}

void compileTimeSave;
