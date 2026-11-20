// posts/*.md を読み、D1 向けの upsert SQL を標準出力に書き出す。
//
//	id    = そのファイルが初めてコミットされた日時（JST, yyyymmddhhmmss）
//	title = 最初の "# " 見出し（無ければ slug）
//	body  = Markdown 全文
package main

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
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
		id, err := firstCommitted(f)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}

		fmt.Fprintf(w,
			"INSERT INTO posts (id, title, body) VALUES (%s, %s, %s) "+
				"ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body;\n",
			quote(id), quote(title(body, id)), quote(body))
	}
}

// ファイルが追加されたコミットの日時を JST で返す（リネームも追跡）。
func firstCommitted(path string) (string, error) {
	cmd := exec.Command("git", "log", "--follow", "--diff-filter=A",
		"--format=%cd", "--date=format-local:%Y%m%d%H%M%S", "--", path)
	cmd.Env = append(os.Environ(), "TZ=Asia/Tokyo")
	out, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("git log %s: %w", path, err)
	}
	lines := strings.Fields(string(out))
	if len(lines) == 0 {
		return "", fmt.Errorf("%s: 未コミットのファイルです", path)
	}
	return lines[len(lines)-1], nil
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
