import * as v from "valibot";

export const POST_STATUSES = ["draft", "published"] as const;

export const PostStatusSchema = v.picklist(
  POST_STATUSES,
  "状態は下書きまたは公開を選んでください。",
);

export type PostStatus = v.InferOutput<typeof PostStatusSchema>;

export const POST_STATUS_LABEL: Record<PostStatus, string> = {
  draft: "下書き",
  published: "公開",
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const PostIdSchema = v.pipe(v.string(), v.regex(SLUG_PATTERN), v.brand("PostId"));

export type PostId = v.InferOutput<typeof PostIdSchema>;

export const PostVersionSchema = v.pipe(
  v.number(),
  v.integer("バージョンは1以上の整数です。"),
  v.minValue(1, "バージョンは1以上の整数です。"),
  v.brand("PostVersion"),
);

export type PostVersion = v.InferOutput<typeof PostVersionSchema>;

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const contentEntries = {
  slug: v.pipe(
    v.string(),
    v.minLength(1, "スラッグを入力してください。"),
    v.maxLength(200, "スラッグは200文字以内で入力してください。"),
    v.regex(SLUG_PATTERN, "スラッグは英小文字、数字、ハイフンで入力してください。"),
  ),
  title: v.pipe(
    v.string(),
    v.minLength(1, "タイトルを入力してください。"),
    v.maxLength(200, "タイトルは200文字以内で入力してください。"),
  ),
  body: v.string(),
  status: PostStatusSchema,
  updatedAt: v.pipe(
    v.string(),
    v.isoDate("更新日は YYYY-MM-DD 形式で入力してください。"),
    v.check(isCalendarDate, "更新日は実在する日付を入力してください。"),
    v.brand("IsoDate"),
  ),
};

export type PostField = keyof typeof contentEntries;

function exactFields<const T extends readonly PostField[]>(
  fields: Exclude<PostField, T[number]> extends never ? T : never,
): T {
  return fields;
}

export const CONTENT_FIELDS = exactFields([
  "slug",
  "title",
  "body",
  "status",
  "updatedAt",
]);

export const CONTENT_COLUMN = {
  slug: "slug",
  title: "title",
  body: "body",
  status: "status",
  updatedAt: "updated_at",
} as const satisfies Record<PostField, string>;

export const PostContentSchema = v.pipe(
  v.strictObject(contentEntries, "入力に使えない項目が含まれています。"),
  v.brand("PostContent"),
);

export type PostContent = v.InferOutput<typeof PostContentSchema>;

export const PostSchema = v.object({
  id: PostIdSchema,
  version: PostVersionSchema,
  content: PostContentSchema,
});

export type Post = v.InferOutput<typeof PostSchema>;

export const PostListResponseSchema = v.object({
  posts: v.array(PostSchema),
});

export const PostResponseSchema = v.object({
  post: PostSchema,
});

export const UpdatePostBodySchema = v.strictObject({
  version: PostVersionSchema,
  content: PostContentSchema,
});

export type UpdatePostBody = v.InferOutput<typeof UpdatePostBodySchema>;

export const ConflictResponseSchema = v.object({
  error: v.literal("Conflict"),
  latest: PostSchema,
});

export const ErrorResponseSchema = v.object({
  error: v.picklist(["NotFound", "InvalidRequest", "StorageError", "SlugTaken"]),
  message: v.optional(v.string()),
});

export type ErrorResponse = v.InferOutput<typeof ErrorResponseSchema>;

export const SLUG_TAKEN_MESSAGE = "そのスラッグは他の記事で既に使われています。";
