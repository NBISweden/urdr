package database_test

import (
	"testing"
	"urdr-api/internal/config"
	"urdr-api/internal/database"
)

func TestSetting(t *testing.T) {
	settingName := "tab"
	settingValue := "diagonal"
	want1 := settingValue
	want2 := ""

	db, err := database.New(config.Config.Database.Path)
	if err != nil {
		t.Fatalf("database.New() returned unexpected error %q", err)
	}

	err = db.SetUserSetting(1, settingName, settingValue)
	if err != nil {
		t.Fatalf("SetUserSetting() failed: %v", err)
	}

	settingValue, err = db.GetUserSetting(1, settingName)
	if err != nil {
		t.Fatalf("GetUserSetting() failed: %v", err)
	}
	if settingValue != want1 {
		t.Fatalf("GetUserSetting() returned %q, expected %q",
			settingValue, want1)
	}

	err = db.DeleteUserSetting(1, settingName)
	if err != nil {
		t.Fatalf("DeleteUserSetting() failed: %v", err)
	}

	settingValue, err = db.GetUserSetting(1, settingName)
	if err != nil {
		t.Fatalf("GetUserSetting() failed: %v", err)
	}
	if settingValue != want2 {
		t.Fatalf("GetUserSetting() returned %q, expected %q",
			settingValue, want1)
	}
}
