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
func (db *Database) getSetting(settingName string) (*Setting, error) {
	if err := db.handle().Ping(); err != nil {
		return nil, fmt.Errorf("sql.Ping() failed: %w", err)
	}

	selectStmt := `
		SELECT	setting_id, value
		FROM	setting
		WHERE	name = ?`

	stmt, err := db.handle().Prepare(selectStmt)
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
		if err := rows.Scan(&settingId, &settingValue); err != nil {
			return nil, fmt.Errorf("sql.Scan() failed: %w", err)
		}

		isValidSetting = true
	}
	if err := rows.Err(); err != nil {
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
func (db *Database) GetUserSetting(redmineUserId int, settingName string) (*Setting, error) {
	setting, err := db.getSetting(settingName)
	if err != nil {
		return nil, fmt.Errorf("getSetting() failed: %w", err)
	}

	selectStmt := `
		SELECT	value
		FROM	user_setting
		WHERE	redmine_user_id = ?
		AND	setting_id = ?`

	stmt, err := db.handle().Prepare(selectStmt)
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
		if err := rows.Scan(&userSettingValue); err != nil {
			return nil, fmt.Errorf("sql.Scan() failed: %w", err)
		}

		userSettingFound = true
	}
	if err := rows.Err(); err != nil {
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
func (db *Database) SetUserSetting(redmineUserId int, settingName string, settingValue string) error {
	setting, err := db.getSetting(settingName)
	if err != nil {
		return fmt.Errorf("getSetting() failed: %w", err)
	}

	insertStmt := `
		INSERT INTO user_setting (redmine_user_id, setting_id, value)
		VALUES (?, ?, ?)`

	stmt, err := db.handle().Prepare(insertStmt)
	if err != nil {
		return fmt.Errorf("sql.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	if _, err := stmt.Exec(redmineUserId, setting.id, settingValue); err != nil {
		return fmt.Errorf("sql.Exec() failed: %w", err)
	}

	return nil
}

// DeleteUserSetting() removes the user-specific value for a particular
// setting.
func (db *Database) DeleteUserSetting(redmineUserId int, settingName string) error {
	setting, err := db.getSetting(settingName)
	if err != nil {
		return fmt.Errorf("getSetting() failed: %w", err)
	}

	deleteStmt := `
		DELETE FROM user_setting
		WHERE	redmine_user_id = ?
		AND	setting_id = ?`

	stmt, err := db.handle().Prepare(deleteStmt)
	if err != nil {
		return fmt.Errorf("sql.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	if _, err := stmt.Exec(redmineUserId, setting.id); err != nil {
		return fmt.Errorf("sql.Exec() failed: %w", err)
	}

	return nil
}
