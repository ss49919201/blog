INSERT OR IGNORE INTO posts (id, slug, title, body, status, updated_at) VALUES
  (
    'hello-world',
    'hello-world',
    'はじめてのブログ記事',
    'ブログを始めました。この記事では、管理画面から下書きを公開するまでの流れを記録します。読んだ人が同じ手順をたどれるように、操作と結果を短く残します。',
    'published',
    '2026-10-28'
  ),
  (
    'html-css-notes',
    'html-css-notes',
    'HTMLとCSSの学習メモ',
    'セマンティックなHTMLを先に書いて、見た目はCSSに任せます。見出し、段落、表を意味どおりに置くと、後からレイアウトを直しても文章の構造が壊れません。',
    'draft',
    '2026-10-30'
  ),
  (
    'flexbox-layout',
    'flexbox-layout',
    'Flexboxでヘッダーを整える',
    'ヘッダーは display: flex で横並びにし、折り返しは flex-wrap に任せます。余白は gap でそろえると、マージンの打ち消しを考えずに済みます。',
    'published',
    '2026-10-15'
  );
