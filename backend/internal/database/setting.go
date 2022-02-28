package database

import (
	"database/sql"
	"fmt"
)

// getSetting() is an internal function that returns the setting_id and
// the value stored for a setting, given the setting's name.  It returns
// an error for illegal settings.
func getSetting(settingName string) (int, string, error) {
	err := db.Ping()
	if err != nil {
		return 0, "", fmt.Errorf("sql.Ping() failed: %w", err)
	}

	sqlStmt := `
		SELECT	setting_id, value
		FROM	setting
		WHERE	name = ?`

	stmt, err := db.Prepare(sqlStmt)
	if err != nil {
		return 0, "", fmt.Errorf("sql.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	rows, err := stmt.Query(settingName)
	if err != nil {
		return 0, "", fmt.Errorf("sql.Query() failed: %w", err)
	}
	defer rows.Close()

	isValidSetting := false
	var settingId int
	var settingValue sql.NullString

	for rows.Next() {
		err = rows.Scan(&settingId, &settingValue)
		if err != nil {
			return 0, "", fmt.Errorf("sql.Scan() failed: %w", err)
		}

		isValidSetting = true
	}
	err = rows.Err()
	if err != nil {
		return 0, "", fmt.Errorf("sql.Next() failed: %w", err)
	}

	if !isValidSetting {
		return 0, "", fmt.Errorf("illegal setting name: %v", settingName)
	}

	if !settingValue.Valid {
		return settingId, "", nil
	}

	return settingId, settingValue.String, nil
}

// GetUserSetting() returns the user-specific value for a particular
// setting.  If there is no user-specific value stored for the given
// user, then the default value is returned, if there is one.
func GetUserSetting(redmineUserId int, settingName string) (string, error) {
	settingId, settingValue, err := getSetting(settingName)
	if err != nil {
		return "", fmt.Errorf("getSetting() failed: %w", err)
	}

	sqlStmt := `
		SELECT	value
		FROM	user_setting
		WHERE	redmine_user_id = ?
		AND	setting_id = ?`

	stmt, err := db.Prepare(sqlStmt)
	if err != nil {
		return "", fmt.Errorf("sql.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	rows, err := stmt.Query(redmineUserId, settingId)
	if err != nil {
		return "", fmt.Errorf("sql.Query() failed: %w", err)
	}
	defer rows.Close()

	userSettingFound := false
	var userSettingValue sql.NullString

	for rows.Next() {
		err = rows.Scan(&userSettingValue)
		if err != nil {
			return "", fmt.Errorf("sql.Scan() failed: %w", err)
		}

		userSettingFound = true
	}
	err = rows.Err()
	if err != nil {
		return "", fmt.Errorf("sql.Next() failed: %w", err)
	}

	if !(userSettingFound && userSettingValue.Valid) {
		// User setting was not found, or value is NULL.
		// Return the default value instead.
		return settingValue, nil
	}

	return userSettingValue.String, nil
}

// SetUserSetting() assigns the user-specific value for a particular
// setting.  If there is already a user-specific value stored for the
// given setting, the new value replaces the old value.
func SetUserSetting(redmineUserId int, settingName string, userSettingValue string) error {
	settingId, _, err := getSetting(settingName)
	if err != nil {
		return fmt.Errorf("getSetting() failed: %w", err)
	}

	sqlStmt := `
		INSERT INTO user_setting (redmine_user_id, setting_id, value)
		VALUES (?, ?, ?)`

	stmt, err := db.Prepare(sqlStmt)
	if err != nil {
		return fmt.Errorf("sql.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	_, err = stmt.Exec(redmineUserId, settingId, userSettingValue)
	if err != nil {
		return fmt.Errorf("sql.Exec() failed: %w", err)
	}

	return nil
}

// DeleteUserSetting() removes the user-specific value for a particular
// setting.
func DeleteUserSetting(redmineUserId int, settingName string) error {
	settingId, _, err := getSetting(settingName)
	if err != nil {
		return fmt.Errorf("getSetting() failed: %w", err)
	}

	sqlStmt := `
		DELETE FROM user_setting
		WHERE	redmine_user_id = ?
		AND	setting_id = ?`

	stmt, err := db.Prepare(sqlStmt)
	if err != nil {
		return fmt.Errorf("sql.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	_, err = stmt.Exec(redmineUserId, settingId)
	if err != nil {
		return fmt.Errorf("sql.Exec() failed: %w", err)
	}

	return nil
}
