package model

import (
	"testing"
	"time"
)

func TestParsePostID(t *testing.T) {
	for _, s := range []string{"20261120150352", "20240229000000"} {
		if _, err := ParsePostID(s); err != nil {
			t.Errorf("ParsePostID(%q) = %v, want ok", s, err)
		}
	}
	for _, s := range []string{
		"", "foo", "2026112015035", "202611201503520", // 形式・桁数
		"20261320150352", "20250229000000", "20261120250000", // 存在しない日時
		"２0261120150352", " 20261120150352",
	} {
		if _, err := ParsePostID(s); err == nil {
			t.Errorf("ParsePostID(%q) = ok, want error", s)
		}
	}
}

func TestNewPostIDRoundTrip(t *testing.T) {
	id := NewPostID(time.Date(2026, 11, 20, 6, 3, 52, 0, time.UTC))
	if id != "20261120150352" {
		t.Fatalf("NewPostID = %q, want JST 20261120150352", id)
	}
	if _, err := ParsePostID(id.String()); err != nil {
		t.Fatal(err)
	}
}
