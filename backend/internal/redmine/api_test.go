package redmine

import (
	"encoding/base64"
	"fmt"
	"os"
	"reflect"
	"strconv"
	"testing"
	"urdr-api/internal/config"

	log "github.com/sirupsen/logrus"
)

var apiKey string
var userName string
var authHeader string
var userId int

func TestMain(m *testing.M) {
	// Correct for the fact that we're in the "wrong" directory.
	err := os.Chdir("../..")
	if err != nil {
		log.Fatalf("os.Chdir() failed: %v", err)
	}

	err = config.Setup()
	if err != nil {
		log.Fatalf("config.Setup() failed: %v", err)
	}

	userName = os.Getenv("USERNAME")
	password := os.Getenv("PASSWORD")
	authHeader = base64.StdEncoding.EncodeToString([]byte(userName + ":" + password))
	log.Debugf("authHeader: %s", authHeader)

	if authHeader == "Og==" {
		log.Fatalf("authHeader is empty, please set USERNAME and PASSWORD environment variables")
	}

	userIdStr := os.Getenv("USER_ID")

	if userIdStr == "" {
		log.Fatalf("userId is empty, please set USER_ID environment variable")
	}

	userId, err = strconv.Atoi(userIdStr)

	if err != nil {
		log.Fatalf("userId is not a number: %v", err)
	}

	os.Exit(m.Run())
}

func TestLogin(t *testing.T) {
	type args struct {
		authHeader string
	}
	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		{name: "test_valid",
			args:    args{authHeader: fmt.Sprintf("Basic %s", authHeader)},
			want:    userName,
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := Login(tt.args.authHeader)
			if (err != nil) != tt.wantErr {
				t.Errorf("Login() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			got := resp.Login
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("Login() = %v, want %v", got, tt.want)
			}
			apiKey = resp.ApiKey
		})
	}
}

func TestGetIssues(t *testing.T) {
	type args struct {
		apiKey   string
		issueIds []string
	}
	tests := []struct {
		name    string
		args    args
		want    uint
		wantErr bool
	}{
		{name: "test_valid",
			args:    args{apiKey: apiKey, issueIds: []string{"3499"}},
			want:    1,
			wantErr: false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := GetIssues(tt.args.apiKey, tt.args.issueIds)
			if (err != nil) != tt.wantErr {
				t.Errorf("GetIssues() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			got := resp.TotalCount
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("GetIssues() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestGetTimeEntries(t *testing.T) {
	type args struct {
		apiKey string
	}
	tests := []struct {
		name    string
		args    args
		want    bool
		wantErr bool
	}{
		{name: "test_valid",
			args:    args{apiKey: apiKey},
			want:    true,
			wantErr: false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := GetTimeEntries(tt.args.apiKey)
			if (err != nil) != tt.wantErr {
				t.Errorf("GetTimeEntries() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			got := len(resp.TimeEntries) > 0
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("GetTimeEntries() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestCreateTimeEntry(t *testing.T) {
	type args struct {
		timeEntry TimeEntry
		apiKey    string
	}

	tests := []struct {
		name    string
		args    args
		wantErr bool
	}{
		{name: "test_valid",
			args: args{apiKey: apiKey, timeEntry: TimeEntry{
				Issue:    3499,
				SpentOn:  "2019-01-01",
				Hours:    2,
				Activity: 18,
				Comments: "test",
				User:     userId,
			}},
			wantErr: false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := CreateTimeEntry(tt.args.timeEntry, tt.args.apiKey); (err != nil) != tt.wantErr {
				t.Errorf("CreateTimeEntry() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
