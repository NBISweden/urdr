package redmine

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	cfg "urdr-api/internal/config"

	log "github.com/sirupsen/logrus"
)

type IdName struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
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

func prepareRequest(
	redmineConf cfg.RedmineConfig,
	method string, endpoint string) (*http.Request, error) {

	url := redmineConf.Host + ":" + redmineConf.Port + endpoint

	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Add("Content-Type", "application/json")

	return req, nil
}

func Login(authHeader string, redmineConf cfg.RedmineConfig) bool {
	req, err := prepareRequest(redmineConf, "GET", "/issues.json")
	if err != nil {
		fmt.Println(err)
		return false
	}
	req.Header.Add("Authorization", authHeader)

	var r

	client := &http.Client{}
	res, err := client.Do(req)
	if err != nil {
		fmt.Println(err)
		return false
	}
	defer res.Body.Close()

	decoder := json.NewDecoder(res.Body)
	err = decoder.Decode(&r)

	return r.TotalCount != 0
}

func ListIssues(redmineConf cfg.RedmineConfig) (IssuesRes, error) {

	url := redmineConf.Host + ":" + redmineConf.Port + "/issues.json"
	method := "GET"

	var r IssuesRes

	client := &http.Client{}
	req, err := http.NewRequest(method, url, nil)

	if err != nil {
		fmt.Println(err)
		return r, err
	}
	req.Header.Add("X-Redmine-API-Key", redmineConf.ApiKey)
	req.Header.Add("Content-Type", "application/json")

	res, err := client.Do(req)
	if err != nil {
		fmt.Println(err)
		return r, err
	}
	defer res.Body.Close()
	decoder := json.NewDecoder(res.Body)

	err = decoder.Decode(&r)
	if err != nil {
		log.Error("Failed decoding response: %s", err)
	}
	return r, err

}

func CreateTimeEntry(redmineConf cfg.RedmineConfig, timeEntry TimeEntry) error {
	var ir timeEntryRequest
	ir.TimeEntry = timeEntry
	s, err := json.Marshal(ir)
	if err != nil {
		return err
	}
	method := "POST"

	client := &http.Client{}
	req, err := http.NewRequest(method, redmineConf.Host+":"+redmineConf.Port+"/time_entries.json", strings.NewReader(string(s)))
	if err != nil {
		return err
	}
	req.Header.Add("X-Redmine-API-Key", redmineConf.ApiKey)
	req.Header.Set("Content-Type", "application/json")
	// Here we impersonate as a user to report his/her time
	req.Header.Set("X-Redmine-Switch-User", "jon")

	res, err := client.Do(req)
	if err != nil {
		log.Errorf("Failed to create time entry: %s", err)
		return err
	}
	defer res.Body.Close()

	if res.StatusCode != 201 {
		log.Errorf("Failed to create time entry: %s", res.Status)
		return errors.New(res.Status)
	} else {
		log.Infof("Created time entry: %s", s)
	}
	return nil
}
