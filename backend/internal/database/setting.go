package database

import (
	"fmt"
	"errors"
	"database/sql"
	_ "github.com/mattn/go-sqlite3"

	log "github.com/sirupsen/logrus"
)

// GetSetting returns the user-specific value for a particular setting.
// If there is no user-specific value stored for the given user, then
// the default value is returned, if there is one.
func GetSetting(user int, setting string) (string, error) {
        // SQL SELECT statement that fetches the value stored in
        // user_setting given the Redmine user ID and the setting name.
        // We also retrieve the default value for the setting at the
        // same time.
	sqlStmt := `
		SELECT	us.redmine_user_id, us.value, s.value
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

	isValidSetting := false
	var dbValue sql.NullString

	for rows.Next() {
                // The default value will be used if the user-specific
                // value is NULL.
		var dbDefaultValue sql.NullString
		var dbUser sql.NullString

		err = rows.Scan(&dbUser, &dbValue, &dbDefaultValue)
		if err != nil {
			log.Error(err)
			return "", errors.New("rows.Scan() failed")
		}
		
                // If the user ID coming back from the database is
                // NULL, then there is no user-specific value for this
                // setting.
		if !dbUser.Valid {
			dbValue = dbDefaultValue
		}

		isValidSetting = true
	}
	err = rows.Err()
	if err != nil {
		log.Error(err)
		return "", errors.New("rows.Next() failed")
	}

	if !isValidSetting {
		return "", errors.New(fmt.Sprintf("Invalid setting: %s", setting))
	}

	if dbValue.Valid {
		return dbValue.String, nil
	}
	return "", nil
}
