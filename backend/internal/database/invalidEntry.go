package database

import (
	"fmt"
)

// invalidActivities is a map that maps a Redmine issue ID to a set of
// Redmine activity IDs.  If an activity ID is present for an issue ID,
// then that combination of issue and activity is invalid.
var invalidActivities map[int][]int

// alwaysInvalidActivities is a map of Redmine activity IDs that are
// always invalid, in combination with any Redmine issue ID.  In the
// backend database, these are stored as Redmine activity IDs related to
// Redmine issues with ID zero.
var alwaysInvalidActivities map[int]bool

// loadAllInvalidEntries() loads the static list of invalid combinations
// of Redmine issue IDs and Redmine activity IDs from the backend
// database into the package-global invalidActivities structure.  This
// map is later used by IsInvalidEntry().
func (db *Database) loadAllInvalidEntries() error {
	selectStmt := `
		SELECT
			redmine_issue_id,
			redmine_activity_id
		FROM
			invalid_entry
		ORDER BY
			redmine_issue_id, redmine_activity_id`

	stmt, err := db.handle().Prepare(selectStmt)
	if err != nil {
		return fmt.Errorf("sql.Prepare() failed: %w", err)
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		return fmt.Errorf("sql.Query() failed: %w", err)
	}
	defer rows.Close()

	invalidActivities = make(map[int][]int)
	alwaysInvalidActivities = make(map[int]bool)

	for rows.Next() {
		var redmineIssueId int
		var redmineActivityId int

		if err := rows.Scan(&redmineIssueId, &redmineActivityId); err != nil {
			return fmt.Errorf("sql.Scan() failed: %w", err)
		}

		if redmineIssueId == 0 {
			alwaysInvalidActivities[redmineActivityId] = true
		} else {
			invalidActivities[redmineIssueId] =
				append(invalidActivities[redmineIssueId],
					redmineActivityId)
		}
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("sql.Next() failed: %w", err)
	}

	return nil
}

func (db *Database) IsInvalidEntry(redmineIssueId int, redmineActivityId int) bool {
	if invalidActivities == nil {
		if err := db.loadAllInvalidEntries(); err != nil {
			fmt.Printf("database.loadAllInvalidEntries() failed: %v\n", err)
			return false
		}
	}

	if alwaysInvalidActivities[redmineActivityId] {
		return true
	}

	for _, i := range invalidActivities[redmineIssueId] {
		if i == redmineActivityId {
			return true
		} else if i > redmineActivityId {
			break
		}

	}

	return false
}
