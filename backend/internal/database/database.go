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

// db is a package-global variable that keeps track of the database
// connection.  This variable is initialized in the package's Setup()
// function.
var db *sql.DB

// Setup() connects to the database, initializing the package-global
// variable db.
func Setup() error {
	var err error

	db, err = sql.Open("sqlite3",
		config.Config.Database.Path+
			"?_auto_vacuum=FULL&_foreign_keys=true")
	if err != nil {
		return fmt.Errorf("sql.Open() failed: %w", err)
	}

	err = db.Ping()
	if err != nil {
		return fmt.Errorf("sql.Ping() failed: %w", err)
	}

	return nil
}
