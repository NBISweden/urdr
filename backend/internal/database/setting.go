package database

import (
	"database/sql"
	"fmt"
)

// GetUserSetting() returns a string containing the user-specific value
// for a particular setting.  If there is no user-specific value stored
// for the given user, an empty string is returned.
func (db *Database) GetUserSetting(redmineUserId int, settingName string) (string, error) {
	selectStmt := `
		SELECT	value
		FROM	user_setting
		WHERE	redmine_user_id = ?
		AND	name = ?`

	stmt, err := db.handle().Prepare(selectStmt)
	if err != nil {
		return "", fmt.Errorf("sql.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	rows, err := stmt.Query(redmineUserId, settingName)
	if err != nil {
		return "", fmt.Errorf("sql.Query() failed: %w", err)
	}
	defer rows.Close()

	userSettingFound := false
	var userSettingValue sql.NullString

	for rows.Next() {
		if err := rows.Scan(&userSettingValue); err != nil {
			return "", fmt.Errorf("sql.Scan() failed: %w", err)
		}

		userSettingFound = true
	}
	if err := rows.Err(); err != nil {
		return "", fmt.Errorf("sql.Next() failed: %w", err)
	}

	if userSettingFound && userSettingValue.Valid {
		// User setting was found and the value is not NULL.
		return userSettingValue.String, nil
	}

	return "", nil
}

// SetUserSetting() assigns the user-specific value for a particular
// setting.  If there is already a user-specific value stored for the
// given setting, the new value replaces the old value.
// If the value is an empty string, the user-specific value is deleted.
func (db *Database) SetUserSetting(redmineUserId int, settingName string, settingValue string) error {
	if settingValue == "" {
                // If the value is an empty string, delete the
                // user-specific setting.
		if err := db.DeleteUserSetting(redmineUserId, settingName); err != nil {
			return fmt.Errorf("DeleteUserSetting() failed: %w", err)
		}
		return nil
	}

	insertStmt := `
		INSERT INTO user_setting (redmine_user_id, name, value)
		VALUES (?, ?, ?)`

	stmt, err := db.handle().Prepare(insertStmt)
	if err != nil {
		return fmt.Errorf("sql.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	if _, err := stmt.Exec(redmineUserId, settingName, settingValue); err != nil {
		return fmt.Errorf("sql.Exec() failed: %w", err)
	}

	return nil
}

// DeleteUserSetting() removes the user-specific value for a particular
// setting.
func (db *Database) DeleteUserSetting(redmineUserId int, settingName string) error {
	deleteStmt := `
		DELETE FROM user_setting
		WHERE	redmine_user_id = ?
		AND	name = ?`

	stmt, err := db.handle().Prepare(deleteStmt)
	if err != nil {
		return fmt.Errorf("sql.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	if _, err := stmt.Exec(redmineUserId, settingName); err != nil {
		return fmt.Errorf("sql.Exec() failed: %w", err)
	}

	return nil
}
