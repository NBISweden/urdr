package database

import (
	"errors"
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

// GetSetting returns the user-specific value for a particular setting.
// If there is no user-specific value stored for the given user, then
// the default value is returned, if there is one.
func GetSetting(user int, setting string) (string, error) {
        // SQL SELECT statement that fetches the value stored in
        // user_setting given the Redmine user ID and the setting name.
        // We also retrieve the default value for the setting at the
        // same time.
	sqlStmt := `
		SELECT	us.value, s.value
		FROM	setting AS s
		LEFT JOIN	user_setting AS us USING (setting_id)
		WHERE	(us.redmine_user_id = ? OR
			 us.redmine_user_id IS NULL)
		AND	s.name = ?`

	stmt, err := db.Prepare(sqlStmt)
	if err != nil {
		log.Error(err)
		return "", errors.New("db.Prepare() failed")
	}
	defer stmt.Close()

	rows, err := stmt.Query(user, setting)
	if err != nil {
		log.Error(err)
		return "", errors.New("stmt.Query() failed")
	}
	defer rows.Close()

	var value sql.NullString

	for rows.Next() {
                // The default value will be used if the user-specific
                // value is NULL.
		var defaultValue sql.NullString

		err = rows.Scan(&value, &defaultValue)
		if err != nil {
			log.Error(err)
			return "", errors.New("rows.Scan() failed")
		}
		
		if !value.Valid {
			value = defaultValue
		}
	}
	err = rows.Err()
	if err != nil {
		log.Error(err)
		return "", errors.New("rows.Next() failed")
	}

	if value.Valid {
		return value.String, nil
	}
	return "", nil
}
