package database

import "fmt"

// The Favorite type is a simple struct that encapsulates a "favorite",
// i.e. a Redmine issue ID and a Redmine activity ID together with a
// custom name.
type Favorite struct {
	RedmineIssueId    int
	RedmineActivityId int
	Name              string
}

// GetAllUserFavorites() returns a list of favorites for a particular
// user.
func GetAllUserFavorites(redmineUserId int) ([]Favorite, error) {
	sqlStmt := `
		SELECT	redmine_issue_id,
			redmine_activity_id,
			name
		FROM	favorite
		WHERE	redmine_user_id = ?
		ORDER BY	priority`

	stmt, err := db.Prepare(sqlStmt)
	if err != nil {
		return nil, fmt.Errorf("sql.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	rows, err := stmt.Query(redmineUserId)
	if err != nil {
		return nil, fmt.Errorf("sql.Query() failed: %w", err)
	}
	defer rows.Close()

	favorites := make([]Favorite, 0)

	for rows.Next() {
		var favorite Favorite

		err = rows.Scan(&favorite.RedmineIssueId,
			&favorite.RedmineActivityId,
			&favorite.Name)
		if err != nil {
			return nil, fmt.Errorf("sql.Scan() failed: %w", err)
		}

		favorites = append(favorites, favorite)
	}
	err = rows.Err()
	if err != nil {
		return nil, fmt.Errorf("sql.Next() failed: %w", err)
	}

	return favorites, nil
}

// SetAllUserFavorites() replaces all stored favorites for the given
// user by the ones provided in the list to this function.
func SetAllUserFavorites(redmineUserId int, favorites []Favorite) error {
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("sql.Begin() failed: %w", err)
	}

	deleteStmt := `
		DELETE FROM favorite
		WHERE	redmine_user_id = ?`

	stmt, err := tx.Prepare(deleteStmt)
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("sql.Tx.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	_, err = stmt.Exec(redmineUserId)
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("sql.Exec() failed: %w", err)
	}

	insertStmt := `
		INSERT INTO favorite (
			redmine_user_id, 
			redmine_issue_id,
			redmine_activity_id,
			name,
			priority )
		VALUES (?, ?, ?, ?, ?)`

	stmt, err = tx.Prepare(insertStmt)
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("sql.Tx.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	for priority, favorite := range favorites {
		_, err = stmt.Exec(redmineUserId,
			favorite.RedmineIssueId,
			favorite.RedmineActivityId,
			favorite.Name,
			priority)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("sql.Exec() failed: %w", err)
		}
	}

	err = tx.Commit()
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("sql.Tx.Commit() failed: %w", err)
	}

	return nil
}
