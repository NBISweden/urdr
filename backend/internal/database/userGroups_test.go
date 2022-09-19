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

	// Set up tests for GetUserGroups().

	tests1 := []struct {
		name string
		args struct{ redmineuserid int }
		want []redmine.Group
	}{
		{
			name: "existing user with groups",
			args: struct{ redmineuserid int }{
				redmineuserid: 1,
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
			name: "non-existing user",
			args: struct{ redmineuserid int }{
				redmineuserid: 0,
			},
			want: nil,
		},
	}

	// Set up tests for GetUsersInGroup().

	tests2 := []struct {
		name string
		args struct{ redminegroupid int }
		want []int
	}{
		{
			name: "Get all users in group 1",
			args: struct{ redminegroupid int }{
				redminegroupid: 1,
			},
			want: []int{1, 2},
		},
	}

	for _, tt1 := range tests1 {
		t.Run(tt1.name, func(t *testing.T) {
			got, err := db.GetUserGroups(tt1.args.redmineuserid)
			if err != nil {
				t.Errorf("error in database api: %v", err)
			}
			if len(got) != len(tt1.want) {
				t.Errorf("wrong length answer, %d != %d", len(got), len(tt1.want))
			}
			for i := range tt1.want {
				if tt1.want[i].Id != got[i].Id || tt1.want[i].Name != got[i].Name {
					t.Errorf("wrong data back, %v != %v", got[i], tt1.want[i])
				}
			}
		})
	}
	for _, tt2 := range tests2 {
		t.Run(tt2.name, func(t *testing.T) {
			got, err := db.GetUsersInGroup(tt2.args.redminegroupid)
			if err != nil {
				t.Errorf("error in database api: %v", err)
			}
			if len(got) != len(tt2.want) {
				t.Errorf("wrong length answer, %d != %d", len(got), len(tt2.want))
			}
			for i := range tt2.want {
				if tt2.want[i] != got[i] {
					t.Errorf("wrong data back, %v != %v", got[i], tt2.want[i])
				}
			}
		})
	}
}
