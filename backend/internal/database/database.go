// The database package provides an API enabling the backend to talk
// to the backend database which provides persistent storage across
// sessions.
package database

import (
	"database/sql"
	"fmt"
	"os"

	// go-sqlite3 is the module for the SQLite3 database driver.
	// It needs to be imported, but we're not actually using
	// it explicitly in this module other than by referring to
	// "sqlite3" when we create the database object in Setup().
	_ "github.com/mattn/go-sqlite3"
	log "github.com/sirupsen/logrus"
)

// A database contains a private method, handle(), that returns a handle
// to the underlying database connection handle.
type Database struct {
	handle func() *sql.DB
}

// New() connects to the database, returns a database object.
func New(databasePath string) (*Database, error) {
	initDB := false

	if _, err := os.Stat(databasePath); err != nil {
		log.Warningf("Database file not found at %v", databasePath)
		initDB = true
	}

	handle, err := sql.Open("sqlite3",
		fmt.Sprintf("%s?%s&%s",
			databasePath,
			"_auto_vacuum=FULL",
			"_foreign_keys=true",
		))
	if err != nil {
		return nil, fmt.Errorf("sql.Open() failed: %w", err)
	}

	if err := handle.Ping(); err != nil {
		return nil, fmt.Errorf("sql.Ping() failed: %w", err)
	}

	if initDB {
		log.Warningln("Initializing database")

		tx, err := handle.Begin()
		if err != nil {
			return nil, fmt.Errorf("sql.Begin() failed: %w", err)
		}

		// Read the two files containing the schema and the
		// available user-specific settings, and run them to
		// initialize the database.
		files := []string{
			"sql/schema.sql",
			"sql/setting-defaults.sql",
		}

		for i := range files {
			query, err := os.ReadFile(files[i])
			if err != nil {
				_ = tx.Rollback()
				return nil,
					fmt.Errorf("os.ReadFile() failed: %w", err)
			}
			if _, err := tx.Exec(string(query)); err != nil {
				_ = tx.Rollback()
				return nil,
					fmt.Errorf("sql.Tx.Exec() failed: %w", err)
			}
		}

		if err := tx.Commit(); err != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("sql.Tx.Commit() failed: %w", err)
		}
	}

	return &Database{handle: func() *sql.DB { return handle }}, nil
}
