// Claude Code のダークテーマ風スタイル。
// 外部ライブラリを使わず、CSS 変数 + Flexbox/Grid だけで組む。
export const styles = `
:root {
  color-scheme: dark;
  --bg: #1f1e1d;
  --surface: #262624;
  --border: #3d3a36;
  --text: #e8e6e3;
  --dim: #8a8580;
  --accent: #d97757;
  --accent-soft: rgb(217 119 87 / 0.12);
  --green: #7fb77e;
  --mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
  --sans: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif;
}

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
  font: 15px/1.7 var(--mono);
  display: flex;
  flex-direction: column;
}

a { color: inherit; text-decoration: none; }

.shell {
  width: min(760px, 100% - 32px);
  margin: 40px auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* ようこそボックス（Claude Code 起動時の枠） */
.welcome {
  border: 1px solid var(--accent);
  border-radius: 8px;
  padding: 16px 20px;
}
.welcome a { font-weight: 600; }

/* 記事一覧：プロンプト行のように並べる */
.entries { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.entries a {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  padding: 10px 14px;
  border-radius: 6px;
  border-left: 2px solid transparent;
}
.entries a:hover, .entries a:focus-visible {
  background: var(--accent-soft);
  border-left-color: var(--accent);
  outline: none;
}
.entries time { color: var(--dim); }
.entries .title::before { content: "> "; color: var(--accent); }


/* 記事詳細 */
article header h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1.4;
  display: flex;
  gap: 10px;
}
article header h1::before { content: "⏺"; color: var(--green); font-size: 0.7em; line-height: 2; }
article header time { display: block; margin: 4px 0 0 26px; color: var(--dim); font-size: 13px; }
article header time::before { content: "⎿  "; }

.body {
  margin-top: 24px;
  padding: 20px 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  /* 日本語本文は等幅だと読みにくいのでサンセリフにする */
  font-family: var(--sans);
  font-size: 16px;
  line-height: 1.9;
}
.body > :first-child { margin-top: 0; }
.body > :last-child { margin-bottom: 0; }
.body code {
  font-family: var(--mono);
  background: var(--bg);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--accent);
}

/* ステータスライン風フッター */
footer {
  border-top: 1px solid var(--border);
  padding: 10px 16px;
  color: var(--dim);
  font-size: 12px;
  display: flex;
  justify-content: space-between;
}
.back { color: var(--dim); }
.back:hover { color: var(--accent); }
`;
