package redmine

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
	cfg "urdr-api/internal/config"

	log "github.com/sirupsen/logrus"
)

type IdName struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type Id struct {
	Id int `json:"id"`
}

type Issue struct {
	Id             int     `json:"id"`
	Subject        string  `json:"subject"`
	Description    string  `json:"description"`
	ProjectId      int     `json:"project_id"`
	Project        *IdName `json:"project"`
	StatusId       int     `json:"status_id"`
	Status         *IdName `json:"status"`
	Author         *IdName `json:"author"`
	AssignedTo     *IdName `json:"assigned_to"`
	AssignedToId   int     `json:"assigned_to_id"`
	Category       *IdName `json:"category"`
	CategoryId     int     `json:"category_id"`
	Notes          string  `json:"notes"`
	StatusDate     string  `json:"status_date"`
	CreatedOn      string  `json:"created_on"`
	UpdatedOn      string  `json:"updated_on"`
	StartDate      string  `json:"start_date"`
	DueDate        string  `json:"due_date"`
	ClosedOn       string  `json:"closed_on"`
	DoneRatio      float32 `json:"done_ratio"`
	EstimatedHours float32 `json:"estimated_hours"`
}

type IssuesRes struct {
	Issues     []Issue `json:"issues"`
	TotalCount uint    `json:"total_count"`
	Offset     uint    `json:"offset"`
	Limit      uint    `json:"limit"`
}

type timeEntryRequest struct {
	TimeEntry TimeEntry `json:"time_entry"`
}

type TimeEntry struct {
	Issue    int    `json:"issue_id"`
	SpentOn  string `json:"spent_on"`
	Hours    int    `json:"hours"`
	Activity int    `json:"activity_id"`
	Comments string `json:"comments"`
	User     int    `json:"user_id"`
}
type TimeEntryResponse struct {
	TimeEntries []FetchedTimeEntry `json:"time_entries"`
}

type FetchedTimeEntry struct {
	Id        int     `json:"id"`
	Project   IdName  `json:"project"`
	Issue     Id      `json:"issue"`
	User      IdName  `json:"user"`
	Activity  IdName  `json:"activity"`
	Hours     float32 `json:"hours"`
	Comments  string  `json:"comments"`
	SpentOn   string  `json:"spent_on"`
	CreatedOn string  `json:"created_on"`
	UpdatedOn string  `json:"updated_on"`
}
type account struct {
	User User `json:"user"`
}

type User struct {
	Id        int    `json:"id"`
	Login     string `json:"login"`
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	ApiKey    string `json:"api_key"`
}

func doRequest(
	redmineConf cfg.RedmineConfig,
	method string, endpoint string,
	headers map[string]string, body string) (*http.Response, error) {

	url := redmineConf.Host + ":" + redmineConf.Port + endpoint

	req, err := http.NewRequest(method, url, strings.NewReader(body))
	if err != nil {
		return nil, err
	}

	for key, value := range headers {
		req.Header.Set(key, value)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func Login(redmineConf cfg.RedmineConfig, authHeader string) (*User, error) {
	res, err :=
		doRequest(redmineConf, "GET", "/my/account.json",
			map[string]string{"Authorization": authHeader}, "")
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	var a account

	decoder := json.NewDecoder(res.Body)

	err = decoder.Decode(&a)
	if err != nil {
		return nil, err
	}
	return &a.User, nil
}

func GetIssues(redmineConf cfg.RedmineConfig, apiKey string, issueIds []string) (*IssuesRes, error) {
	issues := strings.Join(issueIds, ",")
	res, err :=
		doRequest(redmineConf, "GET", fmt.Sprintf("/issues.json?issue_id=%s", issues),
			map[string]string{"X-Redmine-API-Key": apiKey}, "")

	r := &IssuesRes{}

	if err != nil {
		log.Error(err)
		return r, err
	}
	defer res.Body.Close()

	decoder := json.NewDecoder(res.Body)
	err = decoder.Decode(&r)
	if err != nil {
		log.Errorf("Failed decoding response: %s", err)
	}

	return r, err
}

func GetTimeEntries(redmineConf cfg.RedmineConfig, apiKey string, dayFrom string, dayTo string) (*TimeEntryResponse, error) {
	_, err := time.Parse("2006-01-02", dayFrom)
	if err != nil {
		return nil, err
	}
	_, err = time.Parse("2006-01-02", dayTo)
	if err != nil {
		return nil, err
	}

	res, err :=
		doRequest(redmineConf, "GET", fmt.Sprintf("/time_entries.json?user_id=me&from=%s&to=%s", dayFrom, dayTo), map[string]string{"X-Redmine-API-Key": apiKey}, "")

	r := &TimeEntryResponse{}

	if err != nil {
		return r, err
	}
	defer res.Body.Close()

	decoder := json.NewDecoder(res.Body)
	err = decoder.Decode(&r)

	return r, err
}

func CreateTimeEntry(redmineConf cfg.RedmineConfig, timeEntry TimeEntry, apiKey string) error {
	var ir timeEntryRequest

	ir.TimeEntry = timeEntry
	s, err := json.Marshal(ir)
	if err != nil {
		return err
	}

	res, err :=
		doRequest(redmineConf, "POST", "/time_entries.json",
			map[string]string{"X-Redmine-API-Key": apiKey}, string(s))
	if err != nil {
		log.Errorf("Failed to create time entry: %s", err)
		return err
	}
	defer res.Body.Close()

	if res.StatusCode != 201 {
		log.Errorf("Failed to create time entry: %s", res.Status)
		return errors.New(res.Status)
	}
	log.Infof("Created time entry: %s", string(s))

	return nil
}
