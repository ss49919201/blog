import { DataLoader, Page } from "../../../shared/components";
import { services } from "../../../shared/services";

import { PostsTable } from "./posts-table";

import "./posts-list.scss";

const loadPosts = () => services.posts.list();

/** Feature list page (cf. ui/src/app/applications/components/applications-list/). */
export function PostsList() {
  return (
    <Page
      title="記事一覧"
      toolbar={{
        tools: [
          <a key="new" className="button" href="#/posts/new">
            新規作成
          </a>,
        ],
      }}
    >
      <DataLoader
        load={loadPosts}
        errorRenderer={() => (
          <p className="list-status" role="alert">
            記事の読み込みに失敗しました。
          </p>
        )}
      >
        {(posts) => (
          <>
            <p className="list-status" role="status" aria-live="polite">
              {posts.length === 0
                ? "記事がありません。"
                : `${posts.length} 件の記事`}
            </p>
            {posts.length > 0 && <PostsTable posts={posts} />}
          </>
        )}
      </DataLoader>
    </Page>
  );
}
