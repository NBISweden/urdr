package database

import (
	"fmt"
	"regexp"
	"testing"
)

func TestGetIllegalSetting(t *testing.T) {
	settingName := "tuba"
	want := regexp.MustCompilePOSIX("illegal setting name: " + settingName + "$")

	_, err := GetUserSetting(1, settingName)
	if err == nil {
		t.Fatal("GetUserSetting() returned no error")
	}
	if !want.MatchString(fmt.Sprintf("%v", err)) {
		t.Fatalf("GetUserSetting() returned unexpected error %q", err)
	}
}

func TestSetIllegalSetting(t *testing.T) {
	settingName := "tuba"
	settingValue := "bantu"
	want := regexp.MustCompilePOSIX("illegal setting name: " + settingName + "$")

	err := SetUserSetting(1, settingName, settingValue)
	if err == nil {
		t.Fatal("SetUserSetting() returned no error")
	}
	if !want.MatchString(fmt.Sprintf("%v", err)) {
		t.Fatalf("SetUserSetting() returned unexpected error %q", err)
	}
}

func TestDeleteIllegalSetting(t *testing.T) {
	settingName := "tuba"
	want := regexp.MustCompilePOSIX("illegal setting name: " + settingName + "$")

	err := DeleteUserSetting(1, settingName)
	if err == nil {
		t.Fatal("DeleteUserSetting() returned no error")
	}
	if !want.MatchString(fmt.Sprintf("%v", err)) {
		t.Fatalf("DeleteUserSetting() returned unexpected error %q", err)
	}
}

func TestGetDefaultSetting(t *testing.T) {
	settingName := "tab"
	want := "horizontal"

	setting, err := GetUserSetting(1, settingName)
	if err != nil {
		t.Fatalf("GetUserSetting() failed: %v", err)
	}
	if setting.Value != want {
		t.Fatalf("GetUserSetting() returned %q, expected %q",
			setting.Value, want)
	}
}

func TestSetting(t *testing.T) {
	settingName := "tab"
	settingValue := "diagonal"
	want1 := settingValue
	want2 := "horizontal"

	err := SetUserSetting(1, settingName, settingValue)
	if err != nil {
		t.Fatalf("SetUserSetting() failed: %v", err)
	}

	setting, err := GetUserSetting(1, settingName)
	if err != nil {
		t.Fatalf("GetUserSetting() failed: %v", err)
	}
	if setting.Value != want1 {
		t.Fatalf("GetUserSetting() returned %q, expected %q",
			setting.Value, want1)
	}

	err = DeleteUserSetting(1, settingName)
	if err != nil {
		t.Fatalf("DeleteUserSetting() failed: %v", err)
	}

	setting, err = GetUserSetting(1, settingName)
	if err != nil {
		t.Fatalf("GetUserSetting() failed: %v", err)
	}
	if setting.Value != want2 {
		t.Fatalf("GetUserSetting() returned %q, expected %q",
			setting.Value, want1)
	}
}
