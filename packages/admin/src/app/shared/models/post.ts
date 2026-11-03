export type PostStatus = "published" | "draft";

export type Post = {
  readonly id: string;
  readonly title: string;
  readonly status: PostStatus;
  readonly updatedAt: string;
};

const POST_STATUSES: ReadonlySet<string> = new Set(["published", "draft"]);

function isPostStatus(value: unknown): value is PostStatus {
  return typeof value === "string" && POST_STATUSES.has(value);
}

function isPost(value: unknown): value is Post {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    isPostStatus(record.status) &&
    typeof record.updatedAt === "string"
  );
}

/** Parse JSON from posts.json; rejects malformed entries instead of coercing. */
export function parsePostsJson(data: unknown): Post[] {
  if (!Array.isArray(data)) {
    throw new Error("posts.json must be a JSON array");
  }
  const posts: Post[] = [];
  for (const item of data) {
    if (!isPost(item)) {
      throw new Error("Invalid post record in posts.json");
    }
    posts.push(item);
  }
  return posts;
}

export const STATUS_LABEL: Record<PostStatus, string> = {
  published: "公開",
  draft: "下書き",
};
