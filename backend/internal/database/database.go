// The database package provides an API enabling the backend to talk
// to the backend database which provides persistent storage across
// sessions.
package database

import (
	"urdr-api/internal/config"

	"database/sql"
	"fmt"

	// go-sqlite3 is the module for the SQLite3 database driver.
	// It needs to be imported, but we're not actually using
	// it explicitly in this module other than by referring to
	// "sqlite3" when we create the database object in Setup().
	_ "github.com/mattn/go-sqlite3"
)

// A database contains a private method, handle(), that returns a handle
// to the underlying database connection handle.
type database struct {
	handle func() *sql.DB
}

// New() connects to the database, returns a database object.
func New() (*database, error) {
	handle, err := sql.Open("sqlite3",
		fmt.Sprintf("%s?_auto_vacuum=FULL&_foreign_keys=true",
			config.Config.Database.Path))
	if err != nil {
		return nil, fmt.Errorf("sql.Open() failed: %w", err)
	}

	if err := handle.Ping(); err != nil {
		return nil, fmt.Errorf("sql.Ping() failed: %w", err)
	}

	return &database{handle: func() *sql.DB { return handle }}, nil
}
