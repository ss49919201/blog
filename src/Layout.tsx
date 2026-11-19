import type { Child } from "hono/jsx";

export const Layout = (props: { title: string; children?: Child }) => (
  <html lang="ja">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{props.title}</title>
    </head>
    <body>{props.children}</body>
  </html>
);
