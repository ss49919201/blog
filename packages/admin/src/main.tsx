import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/app";
import "./app/shared/styles/global.scss";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("#root が見つかりません");
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
