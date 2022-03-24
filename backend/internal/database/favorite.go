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
func (db *database) GetAllUserFavorites(redmineUserId int) ([]Favorite, error) {
	selectStmt := `
		SELECT	redmine_issue_id,
			redmine_activity_id,
			name
		FROM	favorite
		WHERE	redmine_user_id = ?
		ORDER BY	priority`

	stmt, err := db.handle().Prepare(selectStmt)
	if err != nil {
		return nil, fmt.Errorf("sql.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	rows, err := stmt.Query(redmineUserId)
	if err != nil {
		return nil, fmt.Errorf("sql.Query() failed: %w", err)
	}
	defer rows.Close()

	var favorites []Favorite

	for rows.Next() {
		var favorite Favorite

		if err := rows.Scan(&favorite.RedmineIssueId,
			&favorite.RedmineActivityId,
			&favorite.Name); err != nil {
			return nil, fmt.Errorf("sql.Scan() failed: %w", err)
		}

		favorites = append(favorites, favorite)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("sql.Next() failed: %w", err)
	}

	return favorites, nil
}

// SetAllUserFavorites() replaces all stored favorites for the given
// user by the ones provided in the list to this function.
func (db *database) SetAllUserFavorites(redmineUserId int, favorites []Favorite) error {
	tx, err := db.handle().Begin()
	if err != nil {
		return fmt.Errorf("sql.Begin() failed: %w", err)
	}
	// Defering tx.Rollback() is okay since a rollback after
	// tx.Commit() is a no-op.
	defer func() { _ = tx.Rollback() }()

	// Ideally, we'd call DeleteAllUserFavorites(redmineUserId)
	// here, but we can't do that as we're in a transaction block.
	// The statement object (stmt) in the other function is not
	// related to the transaction here (coming from sql.Prepare()
	// rather than from sql.Tx.Prepare()), so it would execute
	// outside of it and we would not be able to roll it back on
	// errors.

	deleteStmt := `
		DELETE FROM favorite
		WHERE	redmine_user_id = ?`

	stmt, err := tx.Prepare(deleteStmt)
	if err != nil {
		return fmt.Errorf("sql.Tx.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	if _, err := stmt.Exec(redmineUserId); err != nil {
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
		return fmt.Errorf("sql.Tx.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	for priority, favorite := range favorites {
		if _, err := stmt.Exec(redmineUserId,
			favorite.RedmineIssueId,
			favorite.RedmineActivityId,
			favorite.Name,
			priority); err != nil {
			return fmt.Errorf("sql.Exec() failed: %w", err)
		}
	}

	// The deferred tx.Rollback() will be a no-op after this.
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("sql.Tx.Commit() failed: %w", err)
	}

	return nil
}

// DeleteAllUserFavorites() removes all stored favorites for the given
// user.
func (db *database) DeleteAllUserFavorites(redmineUserId int) error {
	deleteStmt := `
		DELETE FROM favorite
		WHERE	redmine_user_id = ?`

	stmt, err := db.handle().Prepare(deleteStmt)
	if err != nil {
		return fmt.Errorf("sql.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	if _, err := stmt.Exec(redmineUserId); err != nil {
		return fmt.Errorf("sql.Exec() failed: %w", err)
	}

	return nil
}
