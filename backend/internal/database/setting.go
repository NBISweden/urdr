package database

import (
	"fmt"
	"errors"
	"database/sql"
	_ "github.com/mattn/go-sqlite3"

	log "github.com/sirupsen/logrus"
)

// getSetting is an internal function that returns the setting_id and
// the value stored for a setting, given the setting's name.  It returns
// an error for illegal settings.
func getSetting(settingName string) (int, string, error) {
	sqlStmt := `
		SELECT	setting_id, value
		FROM	setting
		WHERE	name = ?`

	stmt, err := db.Prepare(sqlStmt)
	if err != nil {
		log.Error(err)
		return 0, "", errors.New("db.Prepare() failed")
	}
	defer stmt.Close()

	rows, err := stmt.Query(settingName)
	if err != nil {
		log.Error(err)
		return 0, "", errors.New("stmt.Query() failed")
	}
	defer rows.Close()

	isValidSetting := false
	var settingId int
	var settingValue sql.NullString

	for rows.Next() {
		err = rows.Scan(&settingId, &settingValue)
		if err != nil {
			log.Error(err)
			return 0, "", errors.New("rows.Scan() failed")
		}

		isValidSetting = true
	}
	err = rows.Err()
	if err != nil {
		log.Error(err)
		return 0, "", errors.New("rows.Next() failed")
	}

	if !isValidSetting {
		return 0, "", errors.New(fmt.Sprintf("Illegal setting name: %s\n", settingName))
	}

	if !settingValue.Valid {
		return settingId, "", nil
	}
	return settingId, settingValue.String, nil
}

// GetUserSetting returns the user-specific value for a particular
// setting.  If there is no user-specific value stored for the given
// user, then the default value is returned, if there is one.
func GetUserSetting(redmineUserId int, settingName string) (string, error) {
	settingId, settingValue, err := getSetting(settingName)
	if err != nil {
		log.Error(err)
		return "", errors.New("getSettingId() failed")
	}

	sqlStmt := `
		SELECT	value
		FROM	user_setting
		WHERE	redmine_user_id = ?
		AND	setting_id = ?`

	stmt, err := db.Prepare(sqlStmt)
	if err != nil {
		log.Error(err)
		return "", errors.New("db.Prepare() failed")
	}
	defer stmt.Close()

	rows, err := stmt.Query(redmineUserId, settingId)
	if err != nil {
		log.Error(err)
		return "", errors.New("stmt.Query() failed")
	}
	defer rows.Close()

	settingFound := false
	var userSettingValue sql.NullString

	for rows.Next() {
		err = rows.Scan(&userSettingValue)
		if err != nil {
			log.Error(err)
			return "", errors.New("rows.Scan() failed")
		}
		
		settingFound = true
	}
	err = rows.Err()
	if err != nil {
		log.Error(err)
		return "", errors.New("rows.Next() failed")
	}

	if !settingFound {
		return settingValue, nil
	}

	if !userSettingValue.Valid {
		return "", nil
	}

	return userSettingValue.String, nil
}

// SetUserSetting assigns the user-specific value for a particular
// setting.  If there is already a user-specific value stored for the
// given setting, the new value replaces the old value.
func SetUserSetting(redmineUserId int, settingName string, userSettingValue string) error {
	settingId, _, err := getSetting(settingName)
	if err != nil {
		log.Error(err)
		return errors.New("getSettingId() failed")
	}

	sqlStmt := `
		INSERT INTO user_setting (redmine_user_id, setting_id, value)
		VALUES (?, ?, ?)`

	stmt, err := db.Prepare(sqlStmt)
	if err != nil {
		log.Error(err)
		return errors.New("db.Prepare() failed")
	}
	defer stmt.Close()

	var res sql.Result
	res, err = stmt.Exec(redmineUserId, settingId, userSettingValue)
	if err != nil {
		log.Error(err)
		return errors.New("db.Exec() failed")
	}

	n, _ := res.RowsAffected()
	log.Printf("Rows affected = %d\n", n)
	return nil
}
