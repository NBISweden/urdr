package database

import (
	"database/sql"
	"fmt"
)

// The Setting type is a simple struct encapsulating a setting,
// containing a setting's name and its value.  The struct also contains
// the internal database identifier for the setting, however, this is
// not externally accessible.
type Setting struct {
	id    int
	Name  string
	Value string
}

// getSetting() is an internal function that returns the setting struct
// (setting ID, name and value), given the setting's name.  It returns
// an error for illegal settings.
func getSetting(settingName string) (*Setting, error) {
	err := db.Ping()
	if err != nil {
		return nil, fmt.Errorf("sql.Ping() failed: %w", err)
	}

	sqlStmt := `
		SELECT	setting_id, value
		FROM	setting
		WHERE	name = ?`

	stmt, err := db.Prepare(sqlStmt)
	if err != nil {
		return nil, fmt.Errorf("sql.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	rows, err := stmt.Query(settingName)
	if err != nil {
		return nil, fmt.Errorf("sql.Query() failed: %w", err)
	}
	defer rows.Close()

	isValidSetting := false
	var settingId int
	var settingValue sql.NullString

	for rows.Next() {
		err = rows.Scan(&settingId, &settingValue)
		if err != nil {
			return nil, fmt.Errorf("sql.Scan() failed: %w", err)
		}

		isValidSetting = true
	}
	err = rows.Err()
	if err != nil {
		return nil, fmt.Errorf("sql.Next() failed: %w", err)
	}

	if !isValidSetting {
		return nil, fmt.Errorf("illegal setting name: %v", settingName)
	}

	var setting Setting
	setting.id = settingId
	setting.Name = settingName

	if settingValue.Valid {
		setting.Value = settingValue.String
	} else {
		setting.Value = ""
	}

	return &setting, nil
}

// GetUserSetting() returns a Setting struct containing the
// user-specific value for a particular setting.  If there is no
// user-specific value stored for the given user, then the default value
// is returned, if there is one.
func GetUserSetting(redmineUserId int, settingName string) (*Setting, error) {
	setting, err := getSetting(settingName)
	if err != nil {
		return nil, fmt.Errorf("getSetting() failed: %w", err)
	}

	sqlStmt := `
		SELECT	value
		FROM	user_setting
		WHERE	redmine_user_id = ?
		AND	setting_id = ?`

	stmt, err := db.Prepare(sqlStmt)
	if err != nil {
		return nil, fmt.Errorf("sql.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	rows, err := stmt.Query(redmineUserId, setting.id)
	if err != nil {
		return nil, fmt.Errorf("sql.Query() failed: %w", err)
	}
	defer rows.Close()

	userSettingFound := false
	var userSettingValue sql.NullString

	for rows.Next() {
		err = rows.Scan(&userSettingValue)
		if err != nil {
			return nil, fmt.Errorf("sql.Scan() failed: %w", err)
		}

		userSettingFound = true
	}
	err = rows.Err()
	if err != nil {
		return nil, fmt.Errorf("sql.Next() failed: %w", err)
	}

	if userSettingFound && userSettingValue.Valid {
		// User setting was found and the value is not NULL.
		setting.Value = userSettingValue.String
	}

	return setting, nil
}

// SetUserSetting() assigns the user-specific value for a particular
// setting.  If there is already a user-specific value stored for the
// given setting, the new value replaces the old value.
func SetUserSetting(redmineUserId int, settingName string, settingValue string) error {
	setting, err := getSetting(settingName)
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

	_, err = stmt.Exec(redmineUserId, setting.id, settingValue)
	if err != nil {
		return fmt.Errorf("sql.Exec() failed: %w", err)
	}

	return nil
}

// DeleteUserSetting() removes the user-specific value for a particular
// setting.
func DeleteUserSetting(redmineUserId int, settingName string) error {
	setting, err := getSetting(settingName)
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

	_, err = stmt.Exec(redmineUserId, setting.id)
	if err != nil {
		return fmt.Errorf("sql.Exec() failed: %w", err)
	}

	return nil
}
