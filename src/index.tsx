import { Hono } from "hono";
import { entries } from "./entries";
import { EntryDetailPage } from "./pages/EntryDetailPage";
import { EntryListPage } from "./pages/EntryListPage";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", (c) => {
  return c.html(<EntryListPage entries={entries} />);
});

app.get("/:id", (c) => {
  const entry = entries.find((entry) => entry.id === c.req.param("id"));
  if (!entry) {
    return c.notFound();
  }
  return c.html(<EntryDetailPage entry={entry} />);
});

export default app;
