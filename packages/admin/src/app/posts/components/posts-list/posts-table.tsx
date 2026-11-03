import { Link } from "react-router-dom";

import { STATUS_LABEL, type Post } from "../../../shared/models/post";

import "./posts-table.scss";

export function formatPostDate(isoDate: string): string {
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

export function PostsTable(props: { posts: Post[] }) {
  return (
    <table className="posts-table">
      <caption className="visually-hidden">
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
        {props.posts.map((post) => (
          <tr key={post.id}>
            <td>
              <Link to={`/posts/${post.id}`}>{post.title}</Link>
            </td>
            <td>
              <span className={`badge badge--${post.status}`}>
                {STATUS_LABEL[post.status]}
              </span>
            </td>
            <td>{formatPostDate(post.updatedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
