import type { Entry } from "../entries";
import { Layout } from "../Layout";

export const EntryListPage = ({ entries }: { entries: Entry[] }) => (
  <Layout title="Blog">
    <h1>Blog</h1>
    <ul>
      {entries.map((entry) => (
        <li>
          <a href={`/${entry.id}`}>{entry.title}</a>
        </li>
      ))}
    </ul>
  </Layout>
);
