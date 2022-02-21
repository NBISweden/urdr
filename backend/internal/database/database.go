package database

import (
	"database/sql"
	_ "github.com/mattn/go-sqlite3"

	log "github.com/sirupsen/logrus"
)

// db is a package-global variable that keeps track of the database
// connection.  This variable is initialized in the package's init
// function.
var db *sql.DB

// init connects to the database, initializing the package-global
// variable db.
func init() {
	var err error

	db, err = sql.Open("sqlite3",
		"./database.db?_auto_vacuum=FULL&_foreign_keys=true")
	if err != nil {
		log.Fatal(err)
	}
}

