# blog

Cloudflare Workers + D1 のブログ。2 つの Worker で構成する。

| ディレクトリ | Worker 名    | 役割                                   |
| ------------ | ------------ | -------------------------------------- |
| `apps/app`   | `blog`       | 公開側。D1 の記事を読んで表示するだけ  |
| `apps/admin` | `blog-admin` | 管理画面。記事の作成・編集・削除       |

両方が同じ D1 データベース（`blog`、バインディング名 `DB`）を参照する。スキーマは `migrations/` にある。

## admin の認証

admin はアプリケーションコードで認証を行わない。Cloudflare Access で前段を保護する前提。
Access を経由しない経路を作らないよう、`apps/admin/wrangler.jsonc` で `workers_dev` と `preview_urls` を無効にしている。公開はカスタムドメイン（`routes`）経由のみにし、そのドメインに Access アプリケーションを設定すること。

## 初回セットアップ

```sh
pnpm install
pnpm --filter admin exec wrangler d1 create blog   # 出力された database_id を apps/*/wrangler.jsonc の両方に書く
pnpm db:migrate:remote
```

## ローカル開発

app と admin は `.wrangler/state` を共有するので、admin で書いた記事がそのまま app に出る。

```sh
pnpm db:migrate:local
pnpm dev:app     # http://localhost:8787
pnpm dev:admin   # http://localhost:8788
```

## デプロイ

```sh
pnpm db:migrate:remote
pnpm deploy:app
pnpm deploy:admin
```

## その他

```sh
pnpm typecheck    # 両 app の型チェック
pnpm cf-typegen   # wrangler.jsonc を変えたら実行し、worker-configuration.d.ts を更新する
```
