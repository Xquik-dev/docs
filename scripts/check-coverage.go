package main

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type metric struct {
	Total, Covered, Skipped int64
}

type summary struct {
	Total map[string]metric
}

func readSummary(path string) (summary, error) {
	var result summary
	data, err := os.ReadFile(path)
	if err == nil {
		err = json.Unmarshal(data, &result)
	}
	return result, err
}

func compare(parent, current summary) error {
	for _, name := range []string{"statements", "branches", "functions", "lines"} {
		percentages := [2]float64{}
		for i, report := range []summary{parent, current} {
			value, exists := report.Total[name]
			if !exists || value.Total <= 0 || value.Covered < 0 || value.Covered > value.Total || value.Skipped != 0 {
				return fmt.Errorf("invalid %s counts in report %d", name, i)
			}
			percentages[i] = 100 * float64(value.Covered) / float64(value.Total)
		}
		required := math.Min(100, percentages[0]+0.1)
		if percentages[1]+1e-10 < required {
			return fmt.Errorf("%s coverage %.8f%% must reach %.8f%%", name, percentages[1], required)
		}
	}
	return nil
}

func git(args ...string) (string, error) {
	output, err := exec.Command("git", args...).Output()
	return strings.TrimSpace(string(output)), err
}

func run() error {
	if len(os.Args) != 2 {
		return fmt.Errorf("usage: check-coverage <current coverage-summary.json>")
	}
	status, err := git("status", "--porcelain", "--untracked-files=all")
	if err != nil {
		return err
	}
	ref := "HEAD^"
	if status != "" {
		ref = "HEAD"
	}
	parent, err := git("rev-parse", "--verify", ref)
	if err != nil {
		return err
	}
	directory, err := git("rev-parse", "--git-common-dir")
	if err != nil {
		return err
	}
	baseline, err := readSummary(filepath.Join(directory, "coverage-baselines", parent, "coverage-summary.json"))
	if err != nil {
		return fmt.Errorf("read verified full-suite coverage for parent %s: %w", parent, err)
	}
	current, err := readSummary(os.Args[1])
	if err != nil {
		return err
	}
	return compare(baseline, current)
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Println("All four coverage metrics meet the parent gain requirement.")
}
