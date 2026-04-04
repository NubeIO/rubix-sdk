package appbuilder

import (
	"fmt"
	"os"
	"regexp"
)

var (
	nameRe    = regexp.MustCompile(`^[a-z][a-z0-9.-]*[a-z0-9]$`)
	versionRe = regexp.MustCompile(`^\d+\.\d+\.\d+$`)
	validArch = map[string]bool{
		"amd64":     true,
		"amd64-win": true,
		"arm64":     true,
		"armv7":     true,
	}
)

func ValidateName(name string) error {
	if name == "" {
		return fmt.Errorf("name is required")
	}
	if len(name) < 2 {
		return fmt.Errorf("name must be at least 2 characters")
	}
	if !nameRe.MatchString(name) {
		return fmt.Errorf("name %q must be lowercase alphanumeric with hyphens or dots", name)
	}
	return nil
}

func ValidateVersion(v string) error {
	if v == "" {
		return fmt.Errorf("version is required")
	}
	if !versionRe.MatchString(v) {
		return fmt.Errorf("version %q must be semver (e.g. 1.0.0)", v)
	}
	return nil
}

func ValidateArch(arch string) error {
	if !validArch[arch] {
		return fmt.Errorf("arch %q must be one of: amd64, amd64-win, arm64, armv7", arch)
	}
	return nil
}

func ValidateSpec(s BuildSpec) error {
	if err := ValidateName(s.Name); err != nil {
		return err
	}
	if err := ValidateVersion(s.Version); err != nil {
		return err
	}
	if err := ValidateArch(s.Arch); err != nil {
		return err
	}
	if len(s.Manifest) == 0 {
		return fmt.Errorf("manifest content is empty")
	}
	if len(s.Files) == 0 {
		return fmt.Errorf("no files specified")
	}
	for _, f := range s.Files {
		if _, err := os.Stat(f.DiskPath); err != nil {
			return fmt.Errorf("file not found: %s", f.DiskPath)
		}
	}
	return nil
}
