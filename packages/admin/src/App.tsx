import { useEffect, useState } from "react";
import * as v from "valibot";
import { PostEditPage } from "./pages/PostEditPage";
import { PostListPage } from "./pages/PostListPage";
import { PostIdSchema, type PostId } from "./types/post";

export type Route = { page: "list" } | { page: "edit"; id: PostId };

export function parseRoute(hash: string): Route {
  const match = /^#\/posts\/([^/]+)$/.exec(hash);
  const idText = match?.[1];
  if (idText === undefined) return { page: "list" };
  try {
    const id = v.safeParse(PostIdSchema, decodeURIComponent(idText));
    if (!id.success) return { page: "list" };
    return { page: "edit", id: id.output };
  } catch {
    return { page: "list" };
  }
}

export function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const route = parseRoute(hash);
  useEffect(() => {
    document.title = route.page === "edit" ? "記事の編集 | ブログ管理" : "記事一覧 | ブログ管理";
  }, [route.page]);
  if (route.page === "edit") return <PostEditPage key={route.id} id={route.id} />;
  return <PostListPage />;
}
