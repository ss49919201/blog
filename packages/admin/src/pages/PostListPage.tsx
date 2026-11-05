import { useEffect, useState } from "react";
import type { Post } from "../types/post";
import styles from "./PostListPage.module.css";

const STATUS_LABEL: Record<Post["status"], string> = {
  published: "公開",
  draft: "下書き",
};

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; posts: Post[] }
  | { kind: "error" };

export function PostListPage() {
  const [loadState, setLoadState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      try {
        const response = await fetch("/data/posts.json");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const posts = (await response.json()) as Post[];
        if (!cancelled) {
          setLoadState({ kind: "ready", posts });
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setLoadState({ kind: "error" });
        }
      }
    }

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  const statusMessage =
    loadState.kind === "loading"
      ? "読み込み中…"
      : loadState.kind === "error"
        ? "記事の読み込みに失敗しました。"
        : loadState.posts.length === 0
          ? "記事がありません。"
          : `${loadState.posts.length} 件の記事`;

  const posts = loadState.kind === "ready" ? loadState.posts : [];

  return (
    <>
      <header className={styles.pageHeader}>
        <h1>記事一覧</h1>
        <a className={styles.button} href="#">
          新規作成
        </a>
      </header>

      <main className={styles.pageMain}>
        <p className={styles.status} role="status" aria-live="polite">
          {statusMessage}
        </p>

        <table className={styles.postTable}>
          <caption className={styles.visuallyHidden}>
            ブログ記事の一覧（タイトル・状態・更新日）
          </caption>
          <thead>
            <tr>
              <th scope="col">タイトル</th>
              <th scope="col">状態</th>
              <th scope="col">更新日</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>
                  <a href={`#/posts/${post.id}`}>{post.title}</a>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles[post.status]}`}>
                    {STATUS_LABEL[post.status]}
                  </span>
                </td>
                <td>{formatDate(post.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </>
  );
}
