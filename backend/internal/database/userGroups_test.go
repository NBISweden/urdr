package database_test

import (
	"database/sql"
	"fmt"
	"testing"
	"urdr-api/internal/config"
	"urdr-api/internal/database"
	"urdr-api/internal/redmine"
)

func TestUserGroups(t *testing.T) {
	db, err := database.New(config.Config.Database.Path)
	if err != nil {
		t.Fatalf("database.New() returned unexpected error %q", err)
	}

	// Insert test data.
	insertStmt := `
	-- Two test groups; IDs 1 and 2.
	INSERT INTO group_info (redmine_group_id, redmine_group_name)
	VALUES
		(1,'Test group 1'),
		(2,'Test group 2');

	-- Three test users; User 1 and 2 are members of
	-- the first two groups, while user 3 is only part of
	-- the second group.
	INSERT INTO user_group (redmine_user_id, redmine_group_id)
	VALUES
		(1, 1), (2, 1),
		(1, 2), (2, 2), (3, 2);
	`
	if handle, err := sql.Open("sqlite3",
		fmt.Sprintf("%s?%s&%s",
			config.Config.Database.Path,
			"_auto_vacuum=FULL",
			"_foreign_keys=true",
		)); err != nil {
		t.Fatal("Failed to open test database")
	} else if _, err := handle.Exec(insertStmt); err != nil {
		t.Fatalf("Failed to insert test data: %v", err)
	}

	// Set up and run tests.

	type args struct {
		redmineUserId int
	}
	tests := []struct {
		name string
		args args
		want []redmine.Group
	}{
		{
			name: "Existing user with groups",
			args: args{
				redmineUserId: 1,
			},
			want: []redmine.Group{
				{
					Id:   1,
					Name: "Test group 1",
				},
				{
					Id:   2,
					Name: "Test group 2",
				},
			},
		},
		{
			name: "Non-existing user",
			args: args{
				redmineUserId: 0,
			},
			want: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := db.GetUserGroups(tt.args.redmineUserId)
			if err != nil {
				t.Errorf("Error in database API: %v", err)
			}
			if len(got) != len(tt.want) {
				t.Errorf("Wrong length answer, %d != %d", len(got), len(tt.want))
			}
			for i := range tt.want {
				if tt.want[i].Id != got[i].Id || tt.want[i].Name != got[i].Name {
					t.Errorf("Wrong data back, %v != %v", got[i], tt.want[i])
				}
			}
		})
	}
}
