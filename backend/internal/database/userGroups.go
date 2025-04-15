package database

import (
	"fmt"
	"urdr-api/internal/redmine"
)

func (db *Database) GetUserGroups(redmine_user_id int) ([]redmine.IdName, error) {
	if err := db.handle().Ping(); err != nil {
		return nil, fmt.Errorf("sql.Ping() failed: %w", err)
	}

	selectStmt := `
		SELECT	user_group_info.redmine_id, user_group_info.redmine_name
		FROM	user_group
		JOIN 	user_group_info ON user_group_info.redmine_id = user_group.redmine_group_id
		WHERE	user_group_info.redmine_type = 'Group' AND user_group.redmine_user_id = ?`

	stmt, err := db.handle().Prepare(selectStmt)
	if err != nil {
		return nil, fmt.Errorf("sql.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	rows, err := stmt.Query(redmine_user_id)
	if err != nil {
		return nil, fmt.Errorf("sql.Query() failed: %w", err)
	}
	defer rows.Close()

	var groups []redmine.IdName

	for rows.Next() {
		var group redmine.IdName

		if err := rows.Scan(&group.Id, &group.Name); err != nil {
			return nil, fmt.Errorf("sql.Scan() failed: %w", err)
		}
		groups = append(groups, group)

	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("sql.Next() failed: %w", err)
	}

	return groups, nil
}

func (db *Database) GetUsersInGroup(redmine_group_id int) ([]redmine.IdName, error) {
	if err := db.handle().Ping(); err != nil {
		return nil, fmt.Errorf("sql.Ping() failed: %w", err)
	}

	selectStmt := `
		SELECT	user_group_info.redmine_id, user_group_info.redmine_name
		FROM	user_group
		JOIN	user_group_info ON user_group_info.redmine_id = user_group.redmine_user_id
		WHERE	user_group_info.redmine_type = 'User' AND user_group.redmine_group_id = ?`

	stmt, err := db.handle().Prepare(selectStmt)
	if err != nil {
		return nil, fmt.Errorf("sql.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	rows, err := stmt.Query(redmine_group_id)
	if err != nil {
		return nil, fmt.Errorf("sql.Query() failed: %w", err)
	}
	defer rows.Close()

	var users []redmine.IdName

	for rows.Next() {
		var user redmine.IdName

		if err := rows.Scan(&user.Id, &user.Name); err != nil {
			return nil, fmt.Errorf("sql.Scan() failed: %w", err)
		}
		users = append(users, user)

	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("sql.Next() failed: %w", err)
	}

	return users, nil
}
