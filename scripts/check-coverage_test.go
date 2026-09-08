package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestReadSummary(t *testing.T) {
	path := filepath.Join(t.TempDir(), "summary.json")
	if _, err := readSummary(path); err == nil {
		t.Fatal("missing report passed")
	}
	for _, data := range []string{"{", `{"total":{"lines":{"total":10,"covered":9,"skipped":0}}}`} {
		if err := os.WriteFile(path, []byte(data), 0600); err != nil {
			t.Fatal(err)
		}
		result, err := readSummary(path)
		if data == "{" {
			if err == nil {
				t.Fatal("malformed report passed")
			}
		} else if err != nil || result.Total["lines"] != (metric{10, 9, 0}) {
			t.Fatalf("report counts changed: %+v, %v", result, err)
		}
	}
}

func TestCompare(t *testing.T) {
	for _, test := range []struct {
		name            string
		parent, current metric
		missing         bool
		failure         string
	}{
		{"exact gain", metric{1000, 500, 0}, metric{1000, 501, 0}, false, ""},
		{"rounded gain fails", metric{10000, 5000, 0}, metric{10000, 5009, 0}, false, "must reach"},
		{"unchanged fails", metric{1000, 500, 0}, metric{1000, 500, 0}, false, "must reach"},
		{"finish coverage", metric{10000, 9999, 0}, metric{10000, 10000, 0}, false, ""},
		{"keep complete", metric{1000, 1000, 0}, metric{1000, 1000, 0}, false, ""},
		{"complete regression", metric{10000, 10000, 0}, metric{10000, 9999, 0}, false, "must reach"},
		{"missing metric", metric{1000, 500, 0}, metric{1000, 501, 0}, true, "invalid"},
		{"empty denominator", metric{1000, 500, 0}, metric{0, 0, 0}, false, "invalid"},
		{"invalid covered", metric{1000, 500, 0}, metric{1000, 1001, 0}, false, "invalid"},
		{"negative covered", metric{1000, 500, 0}, metric{1000, -1, 0}, false, "invalid"},
		{"skipped code", metric{1000, 500, 0}, metric{1000, 501, 1}, false, "invalid"},
		{"invalid parent", metric{0, 0, 0}, metric{1000, 501, 0}, false, "invalid"},
	} {
		for _, name := range []string{"statements", "branches", "functions", "lines"} {
			t.Run(test.name+"/"+name, func(t *testing.T) {
				parent := summary{Total: map[string]metric{}}
				current := summary{Total: map[string]metric{}}
				for _, key := range []string{"statements", "branches", "functions", "lines"} {
					parent.Total[key] = metric{1000, 500, 0}
					current.Total[key] = metric{1000, 501, 0}
				}
				parent.Total[name], current.Total[name] = test.parent, test.current
				if test.missing {
					delete(current.Total, name)
				}
				err := compare(parent, current)
				if test.failure == "" {
					if err != nil {
						t.Fatal(err)
					}
				} else if err == nil || !strings.Contains(err.Error(), test.failure) || !strings.Contains(err.Error(), name) {
					t.Fatalf("expected %s failure for %s, got %v", test.failure, name, err)
				}
			})
		}
	}
}
