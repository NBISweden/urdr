package database

import (
	"urdr-api/internal/config"

	"fmt"
	"database/sql"

	_ "github.com/mattn/go-sqlite3"
)

// db is a package-global variable that keeps track of the database
// connection.  This variable is initialized in the package's init
// function.
var db *sql.DB

// Setup connects to the database, initializing the package-global
// variable db.
func Setup() error {
	var err error

	db, err = sql.Open("sqlite3",
		config.Config.Database.Path+
			"?_auto_vacuum=FULL&_foreign_keys=true")
	if err != nil {
		return fmt.Errorf("sql.Open() failed: %w", err)
	}

	return nil
}
