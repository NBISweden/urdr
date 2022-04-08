package database_test

import (
	"testing"
	"urdr-api/internal/config"
	"urdr-api/internal/database"
)

func TestPriorityEntries(t *testing.T) {
	storeEntries := []database.PriorityEntry{
		{
			RedmineIssueId:    1,
			RedmineActivityId: 1,
			Name:              "Test 1",
			IsHidden:          true,
		},
		{
			RedmineIssueId:    2,
			RedmineActivityId: 1,
			Name:              "Test 2",
			IsHidden:          false,
		}}

	db, err := database.New(config.Config.Database.Path)
	if err != nil {
		t.Fatalf("database.New() returned unexpected error %q", err)
	}

	err = db.DeleteAllUserPriorityEntries(1)
	if err != nil {
		t.Fatalf("DeleteAllUserPriorityEntries() failed: %v", err)
	}

	err = db.SetAllUserPriorityEntries(1, storeEntries)
	if err != nil {
		t.Fatalf("SetAllUserPriorityEntries() failed: %v", err)
	}

	fetchEntries, err := db.GetAllUserPrioityEntries(1)
	if err != nil {
		t.Fatalf("GetAllUserPrioityEntries() failed: %v", err)
	}
	if len(fetchEntries) != len(storeEntries) {
		t.Fatalf("GetAllUserPrioityEntries() returned %d elements, expected %d",
			len(fetchEntries), len(storeEntries))
	}
	for i, f := range fetchEntries {
		if f != storeEntries[i] {
			t.Fatalf("GetAllUserPrioityEntries() returned %v, expected %v",
				fetchEntries, storeEntries)
		}
	}

	err = db.DeleteAllUserPriorityEntries(1)
	if err != nil {
		t.Fatalf("DeleteAllUserPriorityEntries() failed: %v", err)
	}

	fetchEntries, err = db.GetAllUserPrioityEntries(1)
	if err != nil {
		t.Fatalf("GetAllUserPrioityEntries() failed: %v", err)
	}
	if len(fetchEntries) != 0 {
		t.Fatalf("GetAllUGetAllUserPrioityEntrieserFavorites() returned %d elements, expected %d",
			len(fetchEntries), 0)
	}
}
