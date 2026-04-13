package bios

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"text/tabwriter"
)

// printJSON marshals v as indented JSON to stdout.
func printJSON(v any) {
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	if err := enc.Encode(v); err != nil {
		fatal(err)
	}
}

// printTable prints rows as an aligned table.
// headers is the first row; rows follow.
func printTable(headers []string, rows [][]string) {
	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	fmt.Fprintln(w, strings.Join(headers, "\t"))
	for _, row := range rows {
		fmt.Fprintln(w, strings.Join(row, "\t"))
	}
	w.Flush()
}

// jsonMode returns true if --json is present in flags.
func jsonMode(flags []string) bool {
	for _, f := range flags {
		if f == "--json" {
			return true
		}
	}
	return false
}

// parseFlag returns the value of a --key flag, or fallback if not found.
func parseFlag(flags []string, key, fallback string) string {
	for i, f := range flags {
		if f == key && i+1 < len(flags) {
			return flags[i+1]
		}
	}
	return fallback
}

// hasFlag returns true if the flag is present.
func hasFlag(flags []string, name string) bool {
	for _, f := range flags {
		if f == name {
			return true
		}
	}
	return false
}

// requireArg returns the first positional arg (non-flag) or exits with an error.
func requireArg(flags []string, label string) string {
	for i, f := range flags {
		if strings.HasPrefix(f, "--") {
			i++ // skip the value of known flags
			continue
		}
		if i > 0 && strings.HasPrefix(flags[i-1], "--") {
			continue // this is a flag value
		}
		return f
	}
	fatalCode(exitCmdError, fmt.Errorf("missing required argument: %s", label))
	return ""
}

// positionalArgs returns all non-flag arguments.
func positionalArgs(flags []string) []string {
	var args []string
	skip := false
	for _, f := range flags {
		if skip {
			skip = false
			continue
		}
		if strings.HasPrefix(f, "--") {
			skip = true // skip the next value
			continue
		}
		args = append(args, f)
	}
	return args
}

// exitCode exits with a specific code.
const (
	exitOK         = 0
	exitCmdError   = 1
	exitAPIError   = 2
	exitOpFailed   = 3
	exitTimeout    = 4
)

// fatalCode prints an error and exits with the given code.
// If --json was set via setGlobalJSON, outputs structured JSON to stdout.
func fatalCode(code int, err error) {
	if globalJSON {
		json.NewEncoder(os.Stdout).Encode(map[string]any{
			"error": err.Error(),
			"code":  code,
		})
	} else {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
	}
	os.Exit(code)
}

// globalJSON tracks whether --json was passed, so errors can be JSON too.
var globalJSON bool

// setGlobalJSON should be called early in Run() to enable JSON error output.
func setGlobalJSON(flags []string) {
	globalJSON = jsonMode(flags)
}
