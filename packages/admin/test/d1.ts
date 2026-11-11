import { Miniflare } from "miniflare";

const migrations = import.meta.glob<string>("../migrations/*.sql", {
  eager: true,
  import: "default",
  query: "?raw",
});

const seed = import.meta.glob<string>("../seed/local.sql", {
  eager: true,
  import: "default",
  query: "?raw",
});

function sqlFiles(modules: Record<string, string>): string[] {
  return Object.entries(modules)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, sql]) => sql);
}

export async function createTestDb(): Promise<{ db: D1Database; dispose: () => Promise<void> }> {
  const mf = new Miniflare({
    modules: true,
    script: "export default { async fetch() { return new Response(null, { status: 404 }); } }",
    d1Databases: { DB: "admin-test" },
    d1Persist: false,
    // This Miniflare build's workerd rejects dates after 2026-08-06.
    compatibilityDate: "2026-08-06",
  });
  const db = await mf.getD1Database("DB");
  for (const sql of [...sqlFiles(migrations), ...sqlFiles(seed)]) {
    const statements = sql
      .split(/;\s*$/m)
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);
    for (const statement of statements) {
      await db.prepare(statement).run();
    }
  }
  return {
    db,
    dispose: () => mf.dispose(),
  };
}
