// Package model は記事まわりのドメインモデルを定義する。
package model

import (
	"fmt"
	"time"
)

// PostID は記事の ID。JST の作成日時を yyyymmddhhmmss で表した 14 桁の文字列。
type PostID string

const postIDLayout = "20060102150405"

var jst = time.FixedZone("JST", 9*60*60)

// NewPostID は時刻 t から PostID を作る。
func NewPostID(t time.Time) PostID {
	return PostID(t.In(jst).Format(postIDLayout))
}

// ParsePostID は s が PostID の体系に合っているか検証して返す。
func ParsePostID(s string) (PostID, error) {
	t, err := time.ParseInLocation(postIDLayout, s, jst)
	// 往復して一致しなければ体系外（桁数違いなど）
	if err != nil || t.Format(postIDLayout) != s {
		return "", fmt.Errorf("invalid post id %q: want yyyymmddhhmmss (JST)", s)
	}
	return PostID(s), nil
}

func (id PostID) String() string { return string(id) }
