package database_test

import (
	"database/sql"
	"fmt"
	"testing"
	"urdr-api/internal/config"
	"urdr-api/internal/database"
)

func TestIsInvalidEntry(t *testing.T) {
	db, err := database.New(config.Config.Database.Path)
	if err != nil {
		t.Fatalf("database.New() returned unexpected error %q", err)
	}

	// Insert test data.
	insertStmt := `
	INSERT INTO invalid_entry (redmine_issue_id, redmine_activity_id)
	VALUES
		(0,8),
		(1900,8), (1900,14), (1900,20),
                (2000,8), (2000,9), (2000,10), (2000,11), (2000,12),
                (2000,14), (2000,19), (2000,20), (2000,34), (2000,35),
                (2000,104);
	`
	if handle, err := sql.Open("sqlite3",
		fmt.Sprintf("%s?%s&%s",
			config.Config.Database.Path,
			"_auto_vacuum=FULL",
			"_foreign_keys=true",
		)); err != nil {
		t.Fatal("Failed to open test database")
	} else if _, err := handle.Exec(insertStmt); err != nil {
		t.Fatal("Failed to insert test data")
	}

	// Set up and run tests.

	type args struct {
		redmineIssueId    int
		redmineActivityId int
	}
	tests := []struct {
		name string
		args args
		want bool
	}{
		{
			name: "Invalid issue+activity",
			args: args{
				redmineIssueId:    2000,
				redmineActivityId: 35,
			},
			want: false,
		},
		{
			name: "Valid issue+activity",
			args: args{
				redmineIssueId:    1900,
				redmineActivityId: 35,
			},
			want: true,
		},
		{
			name: "Design activity (never valid)",
			args: args{
				redmineIssueId:    1, // Issue ID 1 does not exist in DB
				redmineActivityId: 8, // Activity ID 8 always invalid
			},
			want: false,
		},
		{
			name: "Non-design activity on other issue",
			args: args{
				redmineIssueId:    1, // Issue ID 1 does not exist in DB
				redmineActivityId: 9, // Activity ID 9 is not always invalid
			},
			want: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := db.IsValidEntry(tt.args.redmineIssueId, tt.args.redmineActivityId); got != tt.want {
				t.Errorf("Database.IsValidEntry() = %v, want %v", got, tt.want)
			}
		})
	}
}
