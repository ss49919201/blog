// posts/*.md を読み、D1 向けの upsert SQL を標準出力に書き出す。
//
//	id    = ファイル名（拡張子なし、yyyymmddhhmmss）
//	title = 最初の "# " 見出し（無ければ id）
//	body  = Markdown 全文
package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

const postsDir = "posts"

func main() {
	files, err := filepath.Glob(filepath.Join(postsDir, "*.md"))
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	sort.Strings(files)

	w := bufio.NewWriter(os.Stdout)
	defer w.Flush()

	for _, f := range files {
		b, err := os.ReadFile(f)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		body := string(b)
		id := strings.TrimSuffix(filepath.Base(f), ".md")

		fmt.Fprintf(w,
			"INSERT INTO posts (id, title, body) VALUES (%s, %s, %s) "+
				"ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body;\n",
			quote(id), quote(title(body, id)), quote(body))
	}
}

func title(body, fallback string) string {
	for _, line := range strings.Split(body, "\n") {
		if t, ok := strings.CutPrefix(strings.TrimSpace(line), "# "); ok {
			return strings.TrimSpace(t)
		}
	}
	return fallback
}

// SQLite の文字列リテラル。' を ” にエスケープする。
func quote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", "''") + "'"
}
