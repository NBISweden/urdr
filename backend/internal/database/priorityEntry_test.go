package database_test

import (
	"testing"
	"urdr-api/internal/config"
	"urdr-api/internal/database"
)

func TestFavorites(t *testing.T) {
	storeFaves := []database.PriorityEntry{
		{
			RedmineIssueId:    1,
			RedmineActivityId: 1,
			Name:              "Test 1"},
		{
			RedmineIssueId:    2,
			RedmineActivityId: 1,
			Name:              "Test 2"}}

	db, err := database.New(config.Config.Database.Path)
	if err != nil {
		t.Fatalf("database.New() returned unexpected error %q", err)
	}

	err = db.DeleteAllUserPriorityEntries(1)
	if err != nil {
		t.Fatalf("DeleteAllUserFavorites() failed: %v", err)
	}

	err = db.SetAllUserPriorityEntries(1, storeFaves)
	if err != nil {
		t.Fatalf("SetAllUserFavorites() failed: %v", err)
	}

	fetchFaves, err := db.GetAllUserPrioityEntries(1)
	if err != nil {
		t.Fatalf("GetAllUserFavorites() failed: %v", err)
	}
	if len(fetchFaves) != len(storeFaves) {
		t.Fatalf("GetAllUserFavorites() returned %d elements, expected %d",
			len(fetchFaves), len(storeFaves))
	}
	for i, f := range fetchFaves {
		if f != storeFaves[i] {
			t.Fatalf("GetAllUserFavorites() returned %v, expected %v",
				fetchFaves, storeFaves)
		}
	}

	err = db.DeleteAllUserPriorityEntries(1)
	if err != nil {
		t.Fatalf("DeleteAllUserFavorites() failed: %v", err)
	}

	fetchFaves, err = db.GetAllUserPrioityEntries(1)
	if err != nil {
		t.Fatalf("GetAllUserFavorites() failed: %v", err)
	}
	if len(fetchFaves) != 0 {
		t.Fatalf("GetAllUserFavorites() returned %d elements, expected %d",
			len(fetchFaves), 0)
	}
}
