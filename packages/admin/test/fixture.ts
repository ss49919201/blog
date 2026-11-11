import type { Result } from "neverthrow";
import * as v from "valibot";
import {
  PostContentSchema,
  PostIdSchema,
  type Post,
  type PostContent,
  type PostStatus,
} from "../src/types/post";
import { getPost } from "../worker/index";

export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.isErr()) {
    throw new Error(
      JSON.stringify(result.error, (_key, value: unknown) => {
        if (value instanceof Error) return { name: value.name, message: value.message };
        return value;
      }),
    );
  }
  return result.value;
}

export async function seededPost(db: D1Database, id: string): Promise<Post> {
  return unwrap(await getPost(db, v.parse(PostIdSchema, id)));
}

export function contentOf(
  post: Post,
  patch: Partial<{
    slug: string;
    title: string;
    body: string;
    status: PostStatus;
    updatedAt: string;
  }>,
): PostContent {
  return v.parse(PostContentSchema, {
    slug: patch.slug ?? post.content.slug,
    title: patch.title ?? post.content.title,
    body: patch.body ?? post.content.body,
    status: patch.status ?? post.content.status,
    updatedAt: patch.updatedAt ?? post.content.updatedAt,
  });
}
