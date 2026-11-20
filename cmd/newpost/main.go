// posts/<yyyymmddhhmmss>.md（JST の現在時刻）を雛形付きで作り、パスを標準出力に書く。
package main

import (
	"fmt"
	"os"
	"path/filepath"
	"time"
)

const (
	postsDir = "posts"
	template = "# タイトル\n\n"
)

func main() {
	jst := time.FixedZone("JST", 9*60*60)
	path := filepath.Join(postsDir, time.Now().In(jst).Format("20060102150405")+".md")

	if err := os.MkdirAll(postsDir, 0o755); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	// 既存ファイルは上書きしない
	f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	defer f.Close()

	if _, err := f.WriteString(template); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Println(path)
}
