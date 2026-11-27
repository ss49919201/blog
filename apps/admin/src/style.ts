// 管理画面のスタイル。app と同じ配色を使い、装飾は最小限にする。
export const styles = `
:root {
  color-scheme: dark;
  --bg: #1f1e1d;
  --surface: #262624;
  --border: #3d3a36;
  --text: #e8e6e3;
  --dim: #8a8580;
  --accent: #d97757;
  --red: #e06c6c;
  --green: #7fb77e;
  --font: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif;
  --mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
}

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font: 15px/1.6 var(--font);
}

body > header {
  padding: 12px 24px;
  border-bottom: 1px solid var(--border);
  font-weight: 600;
}

main {
  width: min(960px, 100% - 32px);
  margin: 24px auto;
  display: grid;
  gap: 16px;
}

a { color: var(--accent); }
h1 { margin: 0; font-size: 20px; }

.heading { display: flex; justify-content: space-between; align-items: center; }

table { width: 100%; border-collapse: collapse; }
th, td { padding: 8px 12px; border-bottom: 1px solid var(--border); text-align: left; }
th { color: var(--dim); font-weight: normal; }
td:first-child, td:last-child { color: var(--dim); font-family: var(--mono); font-size: 13px; white-space: nowrap; }

form { display: grid; gap: 16px; }
label { display: grid; gap: 4px; color: var(--dim); }
input, textarea {
  font: inherit;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 10px;
}
textarea { font-family: var(--mono); font-size: 14px; resize: vertical; }

button, .button {
  justify-self: start;
  font: inherit;
  color: var(--bg);
  background: var(--accent);
  border: 0;
  border-radius: 6px;
  padding: 6px 16px;
  cursor: pointer;
  text-decoration: none;
}
button.danger { background: transparent; color: var(--red); border: 1px solid var(--red); }

.errors { margin: 0; padding: 8px 12px 8px 32px; border: 1px solid var(--red); border-radius: 6px; color: var(--red); }
.notice { margin: 0; color: var(--green); }
`;
