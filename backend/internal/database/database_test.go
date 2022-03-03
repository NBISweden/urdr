package database

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

	err = config.Setup()
	if err != nil {
		log.Fatalf("config.Setup() failed: %v", err)
	}

	err = Setup()
	if err != nil {
		log.Fatalf("database.Setup() failed: %v", err)
	}

	os.Exit(m.Run())
}