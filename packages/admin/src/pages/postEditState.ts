import { err, ok, type Result } from "neverthrow";
import * as v from "valibot";
import type { FetchPostError, SavePostError } from "../api/posts";
import { PostContentSchema, type Post, type PostContent } from "../types/post";

export type Notice =
  | { kind: "saved" }
  | { kind: "conflict"; rejected: PostContent }
  | { kind: "slugTaken"; message: string }
  | { kind: "invalid"; message: string }
  | { kind: "failed" };

export type EditState =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "loadFailed" }
  | { kind: "editing"; post: Post; notice: Notice | null }
  | { kind: "saving"; post: Post; submitted: PostContent };

export type EditEvent =
  | { type: "loadSettled"; result: Result<Post, FetchPostError> }
  | { type: "invalid"; message: string }
  | { type: "submitted"; content: PostContent }
  | { type: "saveSettled"; result: Result<Post, SavePostError> };

export const initialEditState: EditState = { kind: "loading" };

export function editReducer(state: EditState, event: EditEvent): EditState {
  switch (event.type) {
    case "loadSettled":
      return loaded(state, event.result);
    case "invalid":
      if (state.kind !== "editing") return state;
      return {
        kind: "editing",
        post: state.post,
        notice: { kind: "invalid", message: event.message },
      };
    case "submitted":
      if (state.kind !== "editing") return state;
      return { kind: "saving", post: state.post, submitted: event.content };
    case "saveSettled":
      if (state.kind !== "saving") return state;
      return saved(state, event.result);
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}

function loaded(state: EditState, result: Result<Post, FetchPostError>): EditState {
  if (state.kind !== "loading") return state;
  if (result.isOk()) return { kind: "editing", post: result.value, notice: null };
  switch (result.error.type) {
    case "NotFound":
      return { kind: "missing" };
    case "Failed":
      return { kind: "loadFailed" };
    default: {
      const _exhaustive: never = result.error;
      return _exhaustive;
    }
  }
}

function saved(
  state: Extract<EditState, { kind: "saving" }>,
  result: Result<Post, SavePostError>,
): EditState {
  if (result.isOk()) {
    return { kind: "editing", post: result.value, notice: { kind: "saved" } };
  }
  switch (result.error.type) {
    case "Conflict":
      return {
        kind: "editing",
        post: result.error.latest,
        notice: { kind: "conflict", rejected: state.submitted },
      };
    case "NotFound":
      return { kind: "missing" };
    case "SlugTaken":
      return {
        kind: "editing",
        post: state.post,
        notice: { kind: "slugTaken", message: result.error.message },
      };
    case "Failed":
      return { kind: "editing", post: state.post, notice: { kind: "failed" } };
    default: {
      const _exhaustive: never = result.error;
      return _exhaustive;
    }
  }
}

export function parsePostForm(form: FormData): Result<PostContent, string> {
  const parsed = v.safeParse(PostContentSchema, Object.fromEntries(form.entries()));
  if (parsed.success) return ok(parsed.output);
  const message = parsed.issues[0]?.message ?? "入力内容を確認してください。";
  return err(message);
}

export function editStatusText(state: EditState): string {
  switch (state.kind) {
    case "loading":
      return "読み込み中…";
    case "saving":
      return "保存中…";
    case "editing":
      return state.notice?.kind === "saved" ? "保存しました。" : "";
    case "missing":
    case "loadFailed":
      return "";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function editAlertText(state: EditState): string | null {
  switch (state.kind) {
    case "missing":
      return "記事が見つかりません。";
    case "loadFailed":
      return "記事の読み込みに失敗しました。";
    case "loading":
    case "saving":
      return null;
    case "editing":
      return alertForNotice(state.post, state.notice);
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

function alertForNotice(post: Post, notice: Notice | null): string | null {
  if (notice === null) return null;
  switch (notice.kind) {
    case "saved":
      return null;
    case "conflict":
      return `他の場所でこの記事が更新されたため、保存できませんでした。最新の内容（バージョン ${post.version}）を読み込みました。`;
    case "slugTaken":
    case "invalid":
      return notice.message;
    case "failed":
      return "保存に失敗しました。時間をおいて再度お試しください。";
    default: {
      const _exhaustive: never = notice;
      return _exhaustive;
    }
  }
}
