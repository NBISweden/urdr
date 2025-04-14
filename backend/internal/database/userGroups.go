package database

import (
	"fmt"
	"urdr-api/internal/redmine"
)

func (db *Database) GetUserGroups(redmine_user_id int) ([]redmine.Group, error) {
	if err := db.handle().Ping(); err != nil {
		return nil, fmt.Errorf("sql.Ping() failed: %w", err)
	}

	selectStmt := `
		SELECT	user_group.redmine_group_id, entity_info.redmine_name
		FROM	user_group
		JOIN 	entity_info ON entity_info.redmine_id = user_group.redmine_group_id
		WHERE	entity_info.redmine_type = 'Group' AND redmine_user_id = ?`

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

	var userGroups []redmine.Group

	for rows.Next() {
		var group redmine.Group

		if err := rows.Scan(&group.Id, &group.Name); err != nil {
			return nil, fmt.Errorf("sql.Scan() failed: %w", err)
		}
		userGroups = append(userGroups, group)

	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("sql.Next() failed: %w", err)
	}

	return userGroups, nil
}

func (db *Database) GetUsersInGroup(redmine_group_id int) ([]int, error) {
	if err := db.handle().Ping(); err != nil {
		return nil, fmt.Errorf("sql.Ping() failed: %w", err)
	}

	selectStmt := `
		SELECT	redmine_user_id
		FROM	user_group
		WHERE	redmine_group_id = ?`

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

	var usersInGroup []int

	for rows.Next() {
		var groupId int

		if err := rows.Scan(&groupId); err != nil {
			return nil, fmt.Errorf("sql.Scan() failed: %w", err)
		}
		usersInGroup = append(usersInGroup, groupId)

	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("sql.Next() failed: %w", err)
	}

	return usersInGroup, nil
}
