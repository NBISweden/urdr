package database_test

import (
	"log"
	"os"
	"testing"

	"urdr-api/internal/config"
)

func TestMain(m *testing.M) {
	// Correct for the fact that we're in the "wrong" directory.
	err := os.Chdir("../..")
	if err != nil {
		log.Fatalf("os.Chdir() failed: %v", err)
	}

	// Put the test DB in a writable temp dir
	// (avoids read-only repo checkout issues in CI).
	tmpDir, err := os.MkdirTemp("", "urdr-dbtest-*")
	if err != nil {
		log.Fatalf("os.MkdirTemp() failed: %v", err)
	}
	defer func() { _ = os.RemoveAll(tmpDir) }() // Clean up temp dir on exit

	testDBPath := tmpDir + "/database.db"
	_ = os.Remove(testDBPath) // Just in case it already exists

	err = config.Setup()
	if err != nil {
		_ = os.RemoveAll(tmpDir)
		log.Fatalf("config.Setup() failed: %v", err)
	}

	config.Config.Database.Path = testDBPath
	code := m.Run()

	_ = os.RemoveAll(tmpDir)

	os.Exit(code)
}
