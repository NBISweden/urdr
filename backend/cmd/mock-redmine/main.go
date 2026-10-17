// mock-redmine is a development stand-in for the NBIS Redmine
// instance: just the endpoints the Urdr backend proxies to, state in
// memory, seeded with time entries relative to the day it starts.
//
// Log in with "dev" / "dev".
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	mockLogin    = "dev"
	mockPassword = "dev"
	mockAPIKey   = "mock00000000000000000000000000000000ffff"
	mockUserID   = 1
	mockUserName = "Dev User"
	dateFormat   = "2006-01-02"
)

type idName struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type issueRef struct {
	Id int `json:"id"`
}

type issue struct {
	Id      int    `json:"id"`
	Subject string `json:"subject"`
	Project idName `json:"project"`
}

type timeEntry struct {
	Id        int      `json:"id"`
	Project   idName   `json:"project"`
	Issue     issueRef `json:"issue"`
	User      idName   `json:"user"`
	Activity  idName   `json:"activity"`
	Hours     float64  `json:"hours"`
	Comments  string   `json:"comments"`
	SpentOn   string   `json:"spent_on"`
	CreatedOn string   `json:"created_on"`
	UpdatedOn string   `json:"updated_on"`
}

// The fixed catalogue.  Issue 3499 and activity 19 must exist: the
// backend's recentIssuesHandler falls back to that pair.
var activityNames = map[int]string{
	9:  "Core Facility Support",
	12: "Development",
	14: "Administration",
	17: "Teaching",
	18: "Professional Development",
	19: "Absence (Vacation/VAB/Other)",
}

var projectActivities = map[int][]int{
	1: {14, 17, 18, 19},
	2: {12, 14},
	3: {9, 14},
	4: {9, 12, 14},
}

var issues = []issue{
	{3499, "NBIS General", idName{1, "NBIS Administration"}},
	{4321, "Urdr development", idName{2, "Internal tools"}},
	{5612, "RNA-seq support for the Karlsson lab", idName{3, "Bioinformatics support"}},
	{5733, "Metagenomics consultation, Lindqvist group", idName{3, "Bioinformatics support"}},
	{6102, "nf-core pipeline maintenance", idName{2, "Internal tools"}},
	{6240, "Training: introduction to RNA-seq", idName{1, "NBIS Administration"}},
	{7101, "GDI WP4", idName{4, "EU projects"}},
	{7102, "BigPicture WP2", idName{4, "EU projects"}},
	{7103, "EUCAIM WP5", idName{4, "EU projects"}},
	// The absence issues, with the IDs the frontend knows them by.
	{6992, "Parental leave", idName{1, "NBIS Administration"}},
	{6993, "Sick leave", idName{1, "NBIS Administration"}},
	{6994, "VAB", idName{1, "NBIS Administration"}},
	{6995, "Vacation", idName{1, "NBIS Administration"}},
	{6997, "Other absence", idName{1, "NBIS Administration"}},
}

type store struct {
	mu      sync.Mutex
	entries []timeEntry
	nextId  int
}

var db = &store{nextId: 1}

func issueById(id int) *issue {
	for i := range issues {
		if issues[i].Id == id {
			return &issues[i]
		}
	}
	return nil
}

func (s *store) add(day time.Time, issueId int, activityId int,
	hours float64, comments string) {

	issue := issueById(issueId)
	stamp := day.Format(time.RFC3339)

	s.entries = append(s.entries, timeEntry{
		Id:        s.nextId,
		Project:   issue.Project,
		Issue:     issueRef{Id: issueId},
		User:      idName{mockUserID, mockUserName},
		Activity:  idName{activityId, activityNames[activityId]},
		Hours:     hours,
		Comments:  comments,
		SpentOn:   day.Format(dateFormat),
		CreatedOn: stamp,
		UpdatedOn: stamp,
	})
	s.nextId++
}

// seed fills the store with weekday entries from the start of the
// previous month up to today: a weekly pattern plus a vacation week,
// a teaching day, an unreported day, a sick day and a VAB half-day.
// Fridays are seeded one hour short.
func (s *store) seed() {
	today := time.Now()
	first := time.Date(today.Year(), today.Month(), 1,
		12, 0, 0, 0, time.Local).AddDate(0, -1, 0)

	for day := first; !day.After(today); day = day.AddDate(0, 0, 1) {
		if day.Weekday() == time.Saturday || day.Weekday() == time.Sunday {
			continue
		}

		inPreviousMonth := day.Month() == first.Month()

		switch {
		case inPreviousMonth && day.Day() >= 10 && day.Day() <= 16:
			s.add(day, 6995, 19, 8, "")
		case inPreviousMonth && day.Day() == 20:
			s.add(day, 6240, 17, 8, "RNA-seq workshop")
		case inPreviousMonth && day.Day() == 25:
			// Unreported day.
		case !inPreviousMonth && day.Day() == 3:
			s.add(day, 6993, 19, 8, "")
		case !inPreviousMonth && day.Day() == 5:
			s.add(day, 6994, 19, 4, "")
			s.add(day, 5612, 9, 4, "")
		default:
			switch day.Weekday() {
			case time.Monday:
				s.add(day, 5612, 9, 6, "")
				s.add(day, 3499, 14, 2, "weekly meeting")
			case time.Tuesday:
				s.add(day, 5612, 9, 4, "")
				s.add(day, 7101, 12, 4, "")
			case time.Wednesday:
				s.add(day, 4321, 12, 5, "")
				s.add(day, 7102, 9, 3, "")
			case time.Thursday:
				s.add(day, 5733, 9, 6, "")
				s.add(day, 6102, 12, 2, "")
			case time.Friday:
				s.add(day, 6102, 12, 2, "")
				s.add(day, 7103, 9, 2, "")
				s.add(day, 3499, 18, 3, "course reading")
			}
		}
	}

	log.Printf("seeded %d time entries between %s and %s",
		len(s.entries), first.Format(dateFormat), today.Format(dateFormat))
}

func sendJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func sendErrors(w http.ResponseWriter, status int, messages ...string) {
	sendJSON(w, status, map[string][]string{"errors": messages})
}

// authenticated checks the X-Redmine-API-Key header.
func authenticated(w http.ResponseWriter, r *http.Request) bool {
	if r.Header.Get("X-Redmine-API-Key") != mockAPIKey {
		sendErrors(w, http.StatusUnauthorized, "Invalid API key")
		return false
	}
	return true
}

func accountHandler(w http.ResponseWriter, r *http.Request) {
	login, password, ok := r.BasicAuth()
	if !ok || login != mockLogin || password != mockPassword {
		w.Header().Set("WWW-Authenticate", `Basic realm="mock-redmine"`)
		sendErrors(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	sendJSON(w, http.StatusOK, map[string]any{
		"user": map[string]any{
			"id":      mockUserID,
			"login":   mockLogin,
			"api_key": mockAPIKey,
		},
	})
}

func getTimeEntriesHandler(w http.ResponseWriter, r *http.Request) {
	if !authenticated(w, r) {
		return
	}

	query := r.URL.Query()

	issueId, _ := strconv.Atoi(query.Get("issue_id"))
	activityId, _ := strconv.Atoi(query.Get("activity_id"))
	from := query.Get("from")
	to := query.Get("to")

	db.mu.Lock()
	defer db.mu.Unlock()

	var matched []timeEntry
	for _, entry := range db.entries {
		if issueId != 0 && entry.Issue.Id != issueId {
			continue
		}
		if activityId != 0 && entry.Activity.Id != activityId {
			continue
		}
		// Dates in ISO format compare correctly as strings.
		if from != "" && entry.SpentOn < from {
			continue
		}
		if to != "" && entry.SpentOn > to {
			continue
		}
		matched = append(matched, entry)
	}

	sort.Slice(matched, func(i, j int) bool {
		if matched[i].SpentOn != matched[j].SpentOn {
			return matched[i].SpentOn > matched[j].SpentOn
		}
		return matched[i].Id > matched[j].Id
	})

	offset, _ := strconv.Atoi(query.Get("offset"))
	limit, err := strconv.Atoi(query.Get("limit"))
	if err != nil || limit <= 0 {
		limit = 25
	} else if limit > 100 {
		limit = 100
	}

	page := []timeEntry{}
	if offset < len(matched) {
		page = matched[offset:min(offset+limit, len(matched))]
	}

	sendJSON(w, http.StatusOK, map[string]any{
		"time_entries": page,
		"total_count":  len(matched),
		"offset":       offset,
		"limit":        limit,
	})
}

type timeEntryBody struct {
	IssueId    int     `json:"issue_id"`
	ActivityId int     `json:"activity_id"`
	Hours      float64 `json:"hours"`
	Comments   string  `json:"comments"`
	SpentOn    string  `json:"spent_on"`
}

// decodeTimeEntry authenticates and decodes a time entry, replying on failure.
func decodeTimeEntry(w http.ResponseWriter, r *http.Request) (timeEntryBody, bool) {
	if !authenticated(w, r) {
		return timeEntryBody{}, false
	}

	var request struct {
		TimeEntry timeEntryBody `json:"time_entry"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		sendErrors(w, http.StatusUnprocessableEntity, "Malformed request body")
		return timeEntryBody{}, false
	}
	return request.TimeEntry, true
}

func postTimeEntriesHandler(w http.ResponseWriter, r *http.Request) {
	entry, ok := decodeTimeEntry(w, r)
	if !ok {
		return
	}

	issue := issueById(entry.IssueId)
	if issue == nil {
		sendErrors(w, http.StatusUnprocessableEntity, "Issue is invalid")
		return
	}

	validActivity := false
	for _, id := range projectActivities[issue.Project.Id] {
		if id == entry.ActivityId {
			validActivity = true
		}
	}
	if !validActivity {
		sendErrors(w, http.StatusUnprocessableEntity,
			"Activity is not included in the list")
		return
	}

	if _, err := time.Parse(dateFormat, entry.SpentOn); err != nil {
		sendErrors(w, http.StatusUnprocessableEntity, "Spent on is invalid")
		return
	}
	if entry.Hours <= 0 {
		sendErrors(w, http.StatusUnprocessableEntity, "Hours is invalid")
		return
	}

	db.mu.Lock()
	defer db.mu.Unlock()

	day, _ := time.Parse(dateFormat, entry.SpentOn)
	db.add(day, entry.IssueId, entry.ActivityId, entry.Hours, entry.Comments)

	sendJSON(w, http.StatusCreated, map[string]any{
		"time_entry": db.entries[len(db.entries)-1],
	})
}

// entryIdFromPath pulls the numeric ID out of "/time_entries/123.json".
func entryIdFromPath(r *http.Request) int {
	id, _ := strconv.Atoi(strings.TrimSuffix(r.PathValue("id"), ".json"))
	return id
}

func putTimeEntryHandler(w http.ResponseWriter, r *http.Request) {
	update, ok := decodeTimeEntry(w, r)
	if !ok {
		return
	}

	db.mu.Lock()
	defer db.mu.Unlock()

	id := entryIdFromPath(r)
	for i := range db.entries {
		if db.entries[i].Id != id {
			continue
		}
		if update.Hours > 0 {
			db.entries[i].Hours = update.Hours
		}
		if update.ActivityId != 0 {
			db.entries[i].Activity =
				idName{update.ActivityId, activityNames[update.ActivityId]}
		}
		if update.SpentOn != "" {
			db.entries[i].SpentOn = update.SpentOn
		}
		db.entries[i].Comments = update.Comments
		db.entries[i].UpdatedOn = time.Now().Format(time.RFC3339)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	w.WriteHeader(http.StatusNotFound)
}

func deleteTimeEntryHandler(w http.ResponseWriter, r *http.Request) {
	if !authenticated(w, r) {
		return
	}

	db.mu.Lock()
	defer db.mu.Unlock()

	id := entryIdFromPath(r)
	for i := range db.entries {
		if db.entries[i].Id == id {
			db.entries = append(db.entries[:i], db.entries[i+1:]...)
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	w.WriteHeader(http.StatusNotFound)
}

func getIssuesHandler(w http.ResponseWriter, r *http.Request) {
	if !authenticated(w, r) {
		return
	}

	wanted := map[int]bool{}
	if param := r.URL.Query().Get("issue_id"); param != "" {
		for _, field := range strings.Split(param, ",") {
			if id, err := strconv.Atoi(strings.TrimSpace(field)); err == nil {
				wanted[id] = true
			}
		}
	}

	matched := []issue{}
	for _, issue := range issues {
		if len(wanted) == 0 || wanted[issue.Id] {
			matched = append(matched, issue)
		}
	}

	sendJSON(w, http.StatusOK, map[string]any{
		"issues":      matched,
		"total_count": len(matched),
		"offset":      0,
		"limit":       len(matched),
	})
}

func getProjectHandler(w http.ResponseWriter, r *http.Request) {
	if !authenticated(w, r) {
		return
	}

	projectId, _ := strconv.Atoi(strings.TrimSuffix(r.PathValue("id"), ".json"))
	activityIds, ok := projectActivities[projectId]
	if !ok {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	activities := []idName{}
	for _, id := range activityIds {
		activities = append(activities, idName{id, activityNames[id]})
	}

	sendJSON(w, http.StatusOK, map[string]any{
		"project": map[string]any{
			"id":                    projectId,
			"time_entry_activities": activities,
		},
	})
}

func searchHandler(w http.ResponseWriter, r *http.Request) {
	if !authenticated(w, r) {
		return
	}

	query := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))
	wantedId, _ := strconv.Atoi(strings.TrimPrefix(query, "#"))

	limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
	if err != nil || limit <= 0 {
		limit = 25
	}

	results := []map[string]any{}
	for _, issue := range issues {
		if len(results) == limit {
			break
		}
		if issue.Id == wantedId ||
			(query != "" && strings.Contains(strings.ToLower(issue.Subject), query)) {
			results = append(results, map[string]any{
				"id":    issue.Id,
				"type":  "issue",
				"title": issue.Subject,
			})
		}
	}

	sendJSON(w, http.StatusOK, map[string]any{
		"results":     results,
		"total_count": len(results),
	})
}

// logged wraps a handler with a one-line request log.
func logged(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s", r.Method, r.URL.String())
		handler.ServeHTTP(w, r)
	})
}

func main() {
	db.seed()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /my/account.json", accountHandler)
	mux.HandleFunc("GET /time_entries.json", getTimeEntriesHandler)
	mux.HandleFunc("POST /time_entries.json", postTimeEntriesHandler)
	mux.HandleFunc("PUT /time_entries/{id}", putTimeEntryHandler)
	mux.HandleFunc("DELETE /time_entries/{id}", deleteTimeEntryHandler)
	mux.HandleFunc("GET /issues.json", getIssuesHandler)
	mux.HandleFunc("GET /projects/{id}", getProjectHandler)
	mux.HandleFunc("GET /search.json", searchHandler)

	port := os.Getenv("MOCK_REDMINE_PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("mock Redmine listening on :%s (log in with %q / %q)",
		port, mockLogin, mockPassword)
	log.Fatal(http.ListenAndServe(":"+port, logged(mux)))
}
