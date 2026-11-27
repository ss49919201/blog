-- 記事テーブル。admin が書き込み、app は読むだけ。
-- published_at は 'YYYY-MM-DD' の文字列で持つ（タイムゾーン変換を挟まない）。
CREATE TABLE posts (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  published_at TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX posts_published_at ON posts (published_at DESC);
