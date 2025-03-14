package database

import "fmt"

// The PriorityEntry type is a simple struct that encapsulates a
// "priority entry", i.e. a Redmine issue ID and subject with its
// corresponding Redmine project ID, and a Redmine activity ID and name
// together with a custom name to which a user has assigned the meaning
// "favorite" or "hidden" using the UI.
type PriorityEntry struct {
	RedmineProjectId    int
	RedmineIssueId      int
	RedmineIssueSubject string
	RedmineActivityId   int
	RedmineActivityName string
	Name                string
	IsHidden            bool
}

// GetAllUserPrioityEntries() returns a list of priority entries for
// a particular user.
func (db *Database) GetAllUserPrioityEntries(redmineUserId int) ([]PriorityEntry, error) {
	selectStmt := `
		SELECT
			redmine_project_id,
			redmine_issue_id,
			redmine_issue_subject,
			redmine_activity_id,
			redmine_activity_name,
			name,
			is_hidden
		FROM	priority_entry
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

	var priorityEntries []PriorityEntry

	for rows.Next() {
		var priorityEntry PriorityEntry

		if err := rows.Scan(&priorityEntry.RedmineProjectId,
			&priorityEntry.RedmineIssueId,
			&priorityEntry.RedmineIssueSubject,
			&priorityEntry.RedmineActivityId,
			&priorityEntry.RedmineActivityName,
			&priorityEntry.Name,
			&priorityEntry.IsHidden); err != nil {
			return nil, fmt.Errorf("sql.Scan() failed: %w", err)
		}

		priorityEntries = append(priorityEntries, priorityEntry)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("sql.Next() failed: %w", err)
	}

	return priorityEntries, nil
}

// SetAllUserPriorityEntries() replaces all stored priority entries for
// the given user by the ones provided in the list to this function.
func (db *Database) SetAllUserPriorityEntries(redmineUserId int, favorites []PriorityEntry) error {
	tx, err := db.handle().Begin()
	if err != nil {
		return fmt.Errorf("sql.Begin() failed: %w", err)
	}
	// Defering tx.Rollback() is okay since a rollback after
	// tx.Commit() is a no-op.
	defer func() { _ = tx.Rollback() }()

	// Ideally, we'd call DeleteAllUserPriorityEntries(redmineUserId)
	// here, but we can't do that as we're in a transaction block.
	// The statement object (stmt) in the other function is not
	// related to the transaction here (coming from sql.Prepare()
	// rather than from sql.Tx.Prepare()), so it would execute
	// outside of it and we would not be able to roll it back on
	// errors.

	deleteStmt := `
		DELETE FROM priority_entry
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
		INSERT INTO priority_entry (
			redmine_user_id, 
			redmine_project_id,
			redmine_issue_id,
			redmine_issue_subject,
			redmine_activity_id,
			redmine_activity_name,
			name,
			is_hidden,
			priority )
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

	stmt, err = tx.Prepare(insertStmt)
	if err != nil {
		return fmt.Errorf("sql.Tx.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	for priority, priorityEntry := range favorites {
		if _, err := stmt.Exec(redmineUserId,
			priorityEntry.RedmineProjectId,
			priorityEntry.RedmineIssueId,
			priorityEntry.RedmineIssueSubject,
			priorityEntry.RedmineActivityId,
			priorityEntry.RedmineActivityName,
			priorityEntry.Name,
			priorityEntry.IsHidden,
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

// DeleteAllUserPriorityEntries() removes all stored priority entries
// for the given user.
func (db *Database) DeleteAllUserPriorityEntries(redmineUserId int) error {
	deleteStmt := `
		DELETE FROM priority_entry
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
