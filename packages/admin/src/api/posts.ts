import { ResultAsync, err, ok, type Result } from "neverthrow";
import * as v from "valibot";
import {
  ConflictResponseSchema,
  ErrorResponseSchema,
  PostListResponseSchema,
  PostResponseSchema,
  type Post,
  type PostContent,
  type PostId,
  type UpdatePostBody,
} from "../types/post";

export type FetchFailed = {
  type: "Failed";
  cause: unknown;
};

export type FetchPostError = { type: "NotFound" } | FetchFailed;

export type SavePostError =
  | { type: "Conflict"; latest: Post }
  | { type: "NotFound" }
  | { type: "SlugTaken"; message: string }
  | FetchFailed;

type HttpResult = {
  status: number;
  body: unknown;
};

export function postPath(id: PostId): string {
  return `/api/posts/${id}`;
}

function request(input: string, init?: RequestInit): ResultAsync<HttpResult, FetchFailed> {
  return ResultAsync.fromPromise(
    (async () => {
      const response = await fetch(input, init);
      const body: unknown = await response.json().catch(() => undefined);
      return { status: response.status, body };
    })(),
    (cause) => ({ type: "Failed", cause }),
  );
}

export function fetchPosts(): ResultAsync<Post[], FetchFailed> {
  return request("/api/posts").andThen(({ status, body }): Result<Post[], FetchFailed> => {
    if (status !== 200) return err({ type: "Failed", cause: body });
    const parsed = v.safeParse(PostListResponseSchema, body);
    if (!parsed.success) return err({ type: "Failed", cause: parsed.issues });
    return ok(parsed.output.posts);
  });
}

export function fetchPost(id: PostId): ResultAsync<Post, FetchPostError> {
  return request(postPath(id)).andThen(({ status, body }): Result<Post, FetchPostError> => {
    if (status === 404) return err({ type: "NotFound" });
    if (status !== 200) return err({ type: "Failed", cause: body });
    const parsed = v.safeParse(PostResponseSchema, body);
    if (!parsed.success) return err({ type: "Failed", cause: parsed.issues });
    return ok(parsed.output.post);
  });
}

export function savePost(base: Post, content: PostContent): ResultAsync<Post, SavePostError> {
  const body = { version: base.version, content } satisfies UpdatePostBody;
  return request(postPath(base.id), {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).andThen(({ status, body: responseBody }): Result<Post, SavePostError> => {
    if (status === 200) {
      const parsed = v.safeParse(PostResponseSchema, responseBody);
      if (!parsed.success) return err({ type: "Failed", cause: parsed.issues });
      return ok(parsed.output.post);
    }
    if (status === 409) {
      const parsed = v.safeParse(ConflictResponseSchema, responseBody);
      if (!parsed.success) return err({ type: "Failed", cause: parsed.issues });
      return err({ type: "Conflict", latest: parsed.output.latest });
    }
    if (status === 404) return err({ type: "NotFound" });
    if (status === 422) {
      const parsed = v.safeParse(ErrorResponseSchema, responseBody);
      if (!parsed.success || parsed.output.error !== "SlugTaken" || parsed.output.message === undefined) {
        return err({ type: "Failed", cause: responseBody });
      }
      return err({ type: "SlugTaken", message: parsed.output.message });
    }
    return err({ type: "Failed", cause: responseBody });
  });
}
