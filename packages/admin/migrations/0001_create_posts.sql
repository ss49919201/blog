CREATE TABLE posts (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE CHECK (slug <> ''),
  title TEXT NOT NULL CHECK (title <> ''),
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);
