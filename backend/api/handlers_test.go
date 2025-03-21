package api_test

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"urdr-api/api"
	_ "urdr-api/docs"
	"urdr-api/internal/config"
	"urdr-api/internal/redmine"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/utils"
	log "github.com/sirupsen/logrus"
)

var app *fiber.App

var urdrSessionHeader string

type endpointTestTable []struct {
	name             string
	method           string
	endpoint         string
	testRedmine      *httptest.Server
	useSessionHeader bool
	requestBody      string
	statusCode       int
}

func TestMain(m *testing.M) {

	err := os.Chdir("../")
	if err != nil {
		log.Fatalf("os.Chdir() failed: %v", err)
	}

	test_db_path := "./testdata/database.db"
	_ = os.Remove(test_db_path)
	test_sessiondb_path := "./testdata/session.db"
	_ = os.Remove(test_sessiondb_path)

	err = config.Setup()
	if err != nil {
		log.Fatalf("config.Setup() failed: %v", err)
	}

	config.Config.Database.Path = test_db_path
	config.Config.App.SessionDBPath = test_sessiondb_path

	app = api.Setup()

	os.Exit(m.Run())
}

func Test_Handlers(t *testing.T) {

	// First we create data that will be used in the tests
	// for sending data to/from the fake Redmine server
	user := redmine.User{
		Id:     1,
		Login:  "testuser",
		ApiKey: "testapikey",
	}
	account := redmine.Account{
		User: user,
	}
	userResponse, _ := json.Marshal(account)

	issues := redmine.IssuesResponse{
		Issues: []redmine.Issue{
			{
				Id:          1,
				Subject:     "Test issue",
				Description: "Test description",
				ProjectId:   1,
				Project:     &redmine.IdName{Id: 1, Name: "Test project"},
			}},
		TotalCount: 1,
		Offset:     0,
		Limit:      1,
	}
	issuesResponse, _ := json.Marshal(issues)

	entry := redmine.TimeEntry{
		Issue:    1,
		SpentOn:  "2020-01-01",
		Hours:    1,
		Activity: 1,
		Comments: "Test comment",
	}
	entryResult := redmine.TimeEntryResult{
		TimeEntry: entry,
	}
	entriesResult := redmine.TimeEntriesResult{
		TimeEntries: []redmine.TimeEntry{entry},
	}

	createdEntry, _ := json.Marshal(entryResult)
	fetchedEntries, _ := json.Marshal(entriesResult)
	projectEntry := redmine.ProjectEntry{
		Project: redmine.Project{
			TimeEntryActivities: []redmine.TimeEntryActivity{
				{
					Id:        1,
					Name:      "test activity",
					IsDefault: true,
				},
			},
		},
	}

	projectActivities, _ := json.Marshal(projectEntry)

	issueAct := []api.PriorityEntry{
		{
			Issue: api.Issue{
				Id:      1,
				Subject: "test issue",
			},
			Activity: api.Activity{
				Id:   1,
				Name: "test activity",
			},
			CustomName: "test name",
			IsHidden:   false,
		},
	}

	issueActsResp, _ := json.Marshal(issueAct)

	// The SearchResult type consists of "Id" and "Title" fields.
	// The SearchResults type consists of "Results" array of SearchResult fields.
	type SearchResult struct {
		Id    int    `json:"id"`
		Title string `json:"title"`
	}
	type SearchResults struct {
		Results []SearchResult `json:"results"`
	}

	issueSearchResults := SearchResults{
		Results: []SearchResult{
			{
				Id:    1,
				Title: "test issue",
			},
		},
	}

	searchResponse, _ := json.Marshal(issueSearchResults)
	var err error

	// Create a fake Redmine server to which redmine requests will be forwarded
	fakeRedmine := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch endpoint := r.URL.Path; endpoint {
		case "/search.json":
			if r.Method == "GET" {
				w.WriteHeader(fiber.StatusOK)
				_, err = w.Write(searchResponse)
			}
			w.WriteHeader(fiber.StatusMethodNotAllowed)
			_, err = w.Write(nil)
		case "/my/account.json":
			_, err = w.Write(userResponse)
		case "/time_entries.json":
			if r.Method == "POST" {
				bodyBytes, err := io.ReadAll(r.Body)
				if err != nil {
					w.WriteHeader(fiber.StatusUnprocessableEntity)
				}
				var postedEntry redmine.TimeEntry
				err = json.Unmarshal(bodyBytes, &postedEntry)
				if err != nil {
					w.WriteHeader(fiber.StatusUnprocessableEntity)
				}
				_, err = w.Write(bodyBytes)
				if err != nil {
					log.Fatalf("%v", err)
				}
			} else if r.Method == "GET" {
				w.WriteHeader(fiber.StatusOK)
				_, err = w.Write(fetchedEntries)
			} else {
				_, err = w.Write(nil)
			}
		case "/issues.json":
			_, err = w.Write(issuesResponse)
		case "/projects/1.json":
			_, err = w.Write(projectActivities)
		default:
			log.Debugf("%s.\n", endpoint)
			_, err = w.Write(nil)
		}
	}))
	defer fakeRedmine.Close()

	// Fake redmine server which sends bad responses
	badRedmine := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(fiber.StatusUnprocessableEntity)
		_, err = w.Write(nil)
	}))
	defer badRedmine.Close()

	if err != nil {
		t.Fatalf("Error: %v", err)
	}

	tests := endpointTestTable{
		{
			name:        "Login",
			method:      "POST",
			endpoint:    "/api/login",
			testRedmine: fakeRedmine,
			statusCode:  fiber.StatusOK,
		},
		{
			name:        "Login 422",
			method:      "POST",
			endpoint:    "/api/login",
			testRedmine: badRedmine,
			statusCode:  fiber.StatusUnprocessableEntity,
		},
		{
			name:             "Recent issues",
			method:           "GET",
			endpoint:         "/api/recent_issues",
			testRedmine:      fakeRedmine,
			useSessionHeader: true,
			statusCode:       fiber.StatusOK,
		},
		{
			name:             "Recent issues 404",
			method:           "GET",
			endpoint:         "/api/recent_issues",
			testRedmine:      fakeRedmine,
			useSessionHeader: false,
			statusCode:       fiber.StatusUnauthorized,
		},
		{
			name:             "Get recent issues 422",
			method:           "GET",
			endpoint:         "/api/recent_issues",
			testRedmine:      badRedmine,
			useSessionHeader: true,
			statusCode:       fiber.StatusUnprocessableEntity,
		},
		{
			name:             "Issues",
			method:           "GET",
			endpoint:         "/api/issues",
			testRedmine:      fakeRedmine,
			useSessionHeader: true,
			statusCode:       fiber.StatusOK,
		},
		{
			name:             "Issues 404",
			method:           "GET",
			endpoint:         "/api/issues",
			testRedmine:      fakeRedmine,
			useSessionHeader: false,
			statusCode:       fiber.StatusUnauthorized,
		},
		{
			name:             "Issues 422",
			method:           "GET",
			endpoint:         "/api/issues",
			testRedmine:      badRedmine,
			useSessionHeader: true,
			statusCode:       fiber.StatusUnprocessableEntity,
		},
		{
			name:             "Time entry POST",
			method:           "POST",
			endpoint:         "/api/time_entries",
			testRedmine:      fakeRedmine,
			requestBody:      string(createdEntry),
			useSessionHeader: true,
			statusCode:       fiber.StatusOK,
		},
		{
			name:             "Time entry POST 401",
			method:           "POST",
			endpoint:         "/api/time_entries",
			testRedmine:      fakeRedmine,
			useSessionHeader: false,
			statusCode:       fiber.StatusUnauthorized,
		},
		{
			name:             "Time entry POST 422",
			method:           "POST",
			endpoint:         "/api/time_entries",
			testRedmine:      fakeRedmine,
			requestBody:      "a bad body",
			useSessionHeader: true,
			statusCode:       fiber.StatusUnprocessableEntity,
		},
		{
			name:             "Time entries",
			method:           "GET",
			endpoint:         "/api/time_entries",
			testRedmine:      fakeRedmine,
			useSessionHeader: true,
			statusCode:       fiber.StatusOK,
		},
		{
			name:             "Time entries 401",
			method:           "GET",
			endpoint:         "/api/time_entries",
			testRedmine:      fakeRedmine,
			useSessionHeader: false,
			statusCode:       fiber.StatusUnauthorized,
		},
		{
			name:             "Time entries 422",
			method:           "GET",
			endpoint:         "/api/time_entries",
			testRedmine:      badRedmine,
			useSessionHeader: true,
			statusCode:       fiber.StatusUnprocessableEntity,
		},
		{
			name:             "Entry activities",
			method:           "GET",
			endpoint:         "/api/activities?project_id=1&issue_id=1",
			testRedmine:      fakeRedmine,
			useSessionHeader: true,
			statusCode:       fiber.StatusOK,
		},
		{
			name:             "Entry activities 401",
			method:           "GET",
			endpoint:         "/api/activities?project_id=1&issue_id=1",
			testRedmine:      fakeRedmine,
			useSessionHeader: false,
			statusCode:       fiber.StatusUnauthorized,
		},
		{
			name:             "Entry activities 422",
			method:           "GET",
			endpoint:         "/api/activities?project_id=1&issue_id=1",
			testRedmine:      badRedmine,
			useSessionHeader: true,
			statusCode:       fiber.StatusUnprocessableEntity,
		},
		{
			name:             "Entry activities no params",
			method:           "GET",
			endpoint:         "/api/activities",
			testRedmine:      badRedmine,
			useSessionHeader: true,
			statusCode:       fiber.StatusOK,
		},
		{
			name:             "priority_entries POST",
			method:           "POST",
			endpoint:         "/api/priority_entries",
			testRedmine:      fakeRedmine,
			requestBody:      string(issueActsResp),
			useSessionHeader: true,
			statusCode:       fiber.StatusNoContent,
		},
		{
			name:             "priority_entries POST 401",
			method:           "POST",
			endpoint:         "/api/priority_entries",
			testRedmine:      fakeRedmine,
			requestBody:      string(issueActsResp),
			useSessionHeader: false,
			statusCode:       fiber.StatusUnauthorized,
		},
		{
			name:             "priority_entries POST 422",
			method:           "POST",
			endpoint:         "/api/priority_entries",
			testRedmine:      fakeRedmine,
			requestBody:      string(issueActsResp[0]),
			useSessionHeader: true,
			statusCode:       fiber.StatusUnprocessableEntity,
		},
		{
			name:             "priority_entries GET",
			method:           "GET",
			endpoint:         "/api/priority_entries",
			testRedmine:      fakeRedmine,
			useSessionHeader: true,
			statusCode:       fiber.StatusOK,
		},
		{
			name:             "priority_entries GET 401",
			method:           "GET",
			endpoint:         "/api/priority_entries",
			testRedmine:      fakeRedmine,
			useSessionHeader: false,
			statusCode:       fiber.StatusUnauthorized,
		},
		{
			name:             "search POST",
			method:           "POST",
			endpoint:         "/api/search",
			testRedmine:      fakeRedmine,
			useSessionHeader: true,
			statusCode:       fiber.StatusOK,
		},
		{
			name:             "search POST 401",
			method:           "POST",
			endpoint:         "/api/search",
			testRedmine:      fakeRedmine,
			useSessionHeader: false,
			statusCode:       fiber.StatusUnauthorized,
		},
		{
			name:             "search GET",
			method:           "GET",
			endpoint:         "/api/search",
			testRedmine:      fakeRedmine,
			useSessionHeader: true,
			statusCode:       fiber.StatusNotFound,
		},
		{
			name:             "groups GET",
			method:           "GET",
			endpoint:         "/api/groups",
			testRedmine:      fakeRedmine,
			useSessionHeader: true,
			statusCode:       fiber.StatusOK,
		},
		{
			name:             "users_in_group GET",
			method:           "GET",
			endpoint:         "/api/users_in_group",
			testRedmine:      fakeRedmine,
			useSessionHeader: true,
			statusCode:       fiber.StatusOK,
		},
		{
			name:             "Logout",
			method:           "POST",
			endpoint:         "/api/logout",
			useSessionHeader: true,
			statusCode:       fiber.StatusNoContent,
		},
		{
			name:             "Logout 401",
			method:           "POST",
			endpoint:         "/api/logout",
			useSessionHeader: false,
			statusCode:       fiber.StatusUnauthorized,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			// This makes sure we talk to the fake redmine server
			if tt.testRedmine != nil {
				config.Config.Redmine.URL = tt.testRedmine.URL
			}

			req := httptest.NewRequest(tt.method, tt.endpoint, strings.NewReader(tt.requestBody))

			if tt.useSessionHeader {
				req.Header.Set("Cookie", urdrSessionHeader)
			}

			resp, err := app.Test(req)
			utils.AssertEqual(t, nil, err)

			// Check if the status code is correct
			statusCode := resp.StatusCode
			if statusCode != tt.statusCode {
				t.Errorf("StatusCode was incorrect, got: %d, want: %d.", statusCode, tt.statusCode)
			}

			if tt.name == "Login" || tt.name == "Time entry POST" {
				urdrSessionHeader = resp.Header.Get("Set-Cookie")
			}

		})
	}
}
