package database

import (
	"testing"
)

func TestFavorites(t *testing.T) {
	storeFaves := []Favorite{
		{
			RedmineIssueId:    1,
			RedmineActivityId: 1,
			Name:              "Test 1"},
		{
			RedmineIssueId:    2,
			RedmineActivityId: 1,
			Name:              "Test 2"}}

	err := DeleteAllUserFavorites(1)
	if err != nil {
		t.Fatalf("DeleteAllUserFavorites() failed: %v", err)
	}

	err = SetAllUserFavorites(1, storeFaves)
	if err != nil {
		t.Fatalf("SetAllUserFavorites() failed: %v", err)
	}

	fetchFaves, err := GetAllUserFavorites(1)
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

	err = DeleteAllUserFavorites(1)
	if err != nil {
		t.Fatalf("DeleteAllUserFavorites() failed: %v", err)
	}

	fetchFaves, err = GetAllUserFavorites(1)
	if err != nil {
		t.Fatalf("GetAllUserFavorites() failed: %v", err)
	}
	if len(fetchFaves) != 0 {
		t.Fatalf("GetAllUserFavorites() returned %d elements, expected %d",
			len(fetchFaves), 0)
	}
}
