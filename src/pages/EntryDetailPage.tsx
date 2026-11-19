import type { Entry } from "../entries";
import { Layout } from "../Layout";

export const EntryDetailPage = ({ entry }: { entry: Entry }) => (
  <Layout title={entry.title}>
    <h1>{entry.title}</h1>
    <p>{entry.publishedAt.toLocaleDateString("ja-JP")}</p>
    <p>{entry.body}</p>
    <a href="/">一覧に戻る</a>
  </Layout>
);
