import { Hono, type Context } from "hono";
import { ResultAsync, err, ok, type Result } from "neverthrow";
import * as v from "valibot";
import {
  CONTENT_COLUMN,
  CONTENT_FIELDS,
  ConflictResponseSchema,
  PostIdSchema,
  PostListResponseSchema,
  PostResponseSchema,
  PostSchema,
  SLUG_TAKEN_MESSAGE,
  UpdatePostBodySchema,
  type ErrorResponse,
  type Post,
  type PostContent,
  type PostId,
  type PostVersion,
} from "../src/types/post";

export type Env = {
  DB: D1Database;
};

export type StorageError = {
  type: "StorageError";
  cause: unknown;
};

export type PostNotFound = {
  type: "NotFound";
  id: PostId;
};

export type VersionConflict = {
  type: "Conflict";
  latest: Post;
};

export type SlugTaken = {
  type: "SlugTaken";
  slug: PostContent["slug"];
};

export type GetPostError = PostNotFound | StorageError;
export type UpdatePostError = PostNotFound | VersionConflict | SlugTaken | StorageError;

export type UpdatePostCommand = Readonly<{
  id: PostId;
  expectedVersion: PostVersion;
  content: PostContent;
}>;

const SELECT_POST = `SELECT id, version, ${CONTENT_FIELDS.map((field) => `${CONTENT_COLUMN[field]} AS ${field}`).join(", ")} FROM posts`;

const UPDATE_POST_IF_VERSION = `UPDATE posts SET ${CONTENT_FIELDS.map((field) => `${CONTENT_COLUMN[field]} = ?`).join(", ")}, version = version + 1 WHERE id = ? AND version = ?`;

const LIST_POSTS = `${SELECT_POST} ORDER BY ${CONTENT_COLUMN.updatedAt} DESC, id`;

const SLUG_UNIQUE_CONSTRAINT = "UNIQUE constraint failed: posts.slug";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRow(row: unknown): Result<Post, StorageError> {
  if (!isRecord(row)) return err({ type: "StorageError", cause: row });
  const content: Record<string, unknown> = {};
  for (const field of CONTENT_FIELDS) {
    content[field] = row[field];
  }
  const parsed = v.safeParse(PostSchema, {
    id: row.id,
    version: row.version,
    content,
  });
  if (!parsed.success) return err({ type: "StorageError", cause: parsed.issues });
  return ok(parsed.output);
}

function parseOptionalRow(row: unknown): Result<Post | null, StorageError> {
  if (row === undefined || row === null) return ok(null);
  return parseRow(row);
}

function rowsToPosts(rows: readonly unknown[]): Result<Post[], StorageError> {
  const posts: Post[] = [];
  for (const row of rows) {
    const parsed = parseRow(row);
    if (parsed.isErr()) return err(parsed.error);
    posts.push(parsed.value);
  }
  return ok(posts);
}

const toStorageError = (cause: unknown): StorageError => ({ type: "StorageError", cause });

function errorText(cause: unknown): string {
  if (cause instanceof Error) {
    const nested = "cause" in cause ? errorText(cause.cause) : "";
    return `${cause.message}\n${nested}`;
  }
  if (typeof cause === "string") return cause;
  if (isRecord(cause) && typeof cause.message === "string") {
    const nested = "cause" in cause ? errorText(cause.cause) : "";
    return `${cause.message}\n${nested}`;
  }
  return "";
}

function toUpdateError(cause: unknown, command: UpdatePostCommand): UpdatePostError {
  if (errorText(cause).includes(SLUG_UNIQUE_CONSTRAINT)) {
    return { type: "SlugTaken", slug: command.content.slug };
  }
  return toStorageError(cause);
}

export function listPosts(db: D1Database): ResultAsync<Post[], StorageError> {
  return ResultAsync.fromPromise(db.prepare(LIST_POSTS).all(), toStorageError).andThen((result) =>
    rowsToPosts(result.results),
  );
}

export function getPost(db: D1Database, id: PostId): ResultAsync<Post, GetPostError> {
  return ResultAsync.fromPromise(
    db.prepare(`${SELECT_POST} WHERE id = ?`).bind(id).first(),
    toStorageError,
  ).andThen((row): Result<Post, GetPostError> => {
    if (row === null) return err({ type: "NotFound", id });
    return parseRow(row);
  });
}

function classifyUpdate(
  command: UpdatePostCommand,
  changes: number,
  current: Post | null,
): Result<Post, UpdatePostError> {
  if (current === null) {
    if (changes === 0) return err({ type: "NotFound", id: command.id });
    return err({ type: "StorageError", cause: { changes, id: command.id } });
  }
  if (changes === 0) return err({ type: "Conflict", latest: current });
  if (changes === 1) return ok(current);
  return err({ type: "StorageError", cause: { changes, id: command.id } });
}

export function updatePost(
  db: D1Database,
  command: UpdatePostCommand,
): ResultAsync<Post, UpdatePostError> {
  const update = db
    .prepare(UPDATE_POST_IF_VERSION)
    .bind(
      ...CONTENT_FIELDS.map((field) => command.content[field]),
      command.id,
      command.expectedVersion,
    );
  const current = db.prepare(`${SELECT_POST} WHERE id = ?`).bind(command.id);
  return ResultAsync.fromPromise(db.batch([update, current]), (cause) =>
    toUpdateError(cause, command),
  ).andThen((results): Result<Post, UpdatePostError> => {
    const updated = results[0];
    const selected = results[1];
    if (updated === undefined || selected === undefined) {
      return err({ type: "StorageError", cause: results });
    }
    return parseOptionalRow(selected.results[0]).andThen((row) =>
      classifyUpdate(command, updated.meta.changes, row),
    );
  });
}

const app = new Hono<{ Bindings: Env }>().basePath("/api");

app.get("/posts", async (c) => {
  const listed = await listPosts(c.env.DB);
  return listed.match(
    (posts) => c.json({ posts } satisfies v.InferOutput<typeof PostListResponseSchema>, 200),
    (error) => {
      console.error(error.cause);
      return c.json({ error: "StorageError" } satisfies ErrorResponse, 500);
    },
  );
});

app.get("/posts/:id", async (c) => {
  const id = v.safeParse(PostIdSchema, c.req.param("id"));
  if (!id.success) return c.json({ error: "NotFound" } satisfies ErrorResponse, 404);
  const loaded = await getPost(c.env.DB, id.output);
  return loaded.match(
    (post) => c.json({ post } satisfies v.InferOutput<typeof PostResponseSchema>, 200),
    (error) => {
      if (error.type === "NotFound") return c.json({ error: "NotFound" } satisfies ErrorResponse, 404);
      console.error(error.cause);
      return c.json({ error: "StorageError" } satisfies ErrorResponse, 500);
    },
  );
});

app.put("/posts/:id", async (c) => {
  const body: unknown = await c.req.json().catch(() => undefined);
  const command = parseUpdateCommand(c.req.param("id"), body);
  if (command.isErr()) {
    const status = command.error.error === "NotFound" ? 404 : 400;
    return c.json(command.error, status);
  }
  const saved = await updatePost(c.env.DB, command.value);
  return saved.match(
    (post) => c.json({ post } satisfies v.InferOutput<typeof PostResponseSchema>, 200),
    (error) => respondUpdateError(c, error),
  );
});

app.all("*", (c) => c.json({ error: "NotFound" } satisfies ErrorResponse, 404));

export function parseUpdateCommand(
  idParam: string,
  body: unknown,
): Result<UpdatePostCommand, ErrorResponse> {
  const id = v.safeParse(PostIdSchema, idParam);
  if (!id.success) return err({ error: "NotFound" });
  const parsed = v.safeParse(UpdatePostBodySchema, body);
  if (!parsed.success) return err(invalidRequest(parsed.issues));
  return ok({
    id: id.output,
    expectedVersion: parsed.output.version,
    content: parsed.output.content,
  });
}

function invalidRequest(issues: readonly v.BaseIssue<unknown>[]): ErrorResponse {
  const [first, ...rest] = issues;
  if (!first) return { error: "InvalidRequest", message: "入力内容を確認してください。" };
  return { error: "InvalidRequest", message: v.summarize([first, ...rest]) };
}

function respondUpdateError(c: Context<{ Bindings: Env }>, error: UpdatePostError): Response {
  switch (error.type) {
    case "NotFound":
      return c.json({ error: "NotFound" } satisfies ErrorResponse, 404);
    case "Conflict":
      return c.json(
        { error: "Conflict", latest: error.latest } satisfies v.InferOutput<typeof ConflictResponseSchema>,
        409,
      );
    case "SlugTaken":
      return c.json(
        { error: "SlugTaken", message: SLUG_TAKEN_MESSAGE } satisfies ErrorResponse,
        422,
      );
    case "StorageError":
      console.error(error.cause);
      return c.json({ error: "StorageError" } satisfies ErrorResponse, 500);
    default: {
      const _exhaustive: never = error;
      return _exhaustive;
    }
  }
}

export { app };
export default app;
