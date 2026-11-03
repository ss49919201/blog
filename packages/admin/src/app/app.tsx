import { Suspense, lazy } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout, type NavItem } from "./shared/components";
import { services } from "./shared/services";
import { setBaseHref } from "./shared/services/requests";

import "./app.scss";

services.viewPreferences.init();

const bases = document.getElementsByTagName("base");
const base = bases.length > 0 ? bases[0].getAttribute("href") || "/" : "/";
setBaseHref(base);

const navItems: NavItem[] = [{ path: "/posts", title: "記事" }];

const PostsPage = lazy(() =>
  import("./posts").then((m) => ({ default: m.default.component })),
);

function RouteSpinner() {
  return <p className="route-spinner">読み込み中…</p>;
}

export function App() {
  return (
    <HashRouter>
      <AppLayout navItems={navItems}>
        <Suspense fallback={<RouteSpinner />}>
          <Routes>
            <Route path="/" element={<Navigate to="/posts" replace />} />
            <Route path="/posts" element={<PostsPage />} />
            <Route path="*" element={<Navigate to="/posts" replace />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </HashRouter>
  );
}
