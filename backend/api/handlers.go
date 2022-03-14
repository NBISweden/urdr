package api

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
	log "github.com/sirupsen/logrus"

	_ "urdr-api/docs"

	"urdr-api/internal/config"
	"urdr-api/internal/redmine"
)

type LoginResponse struct {
	Login  string `json:"login"`
	UserId int    `json:"user_id"`
}
type IssueActivityResponse struct {
	Issue    redmine.Issue  `json:"issue"`
	Activity redmine.IdName `json:"activity"`
}
type IssueActivity struct {
	Issue    int
	Activity redmine.IdName
}

type SpentOnIssueActivityResponse struct {
	Issue    redmine.Issue  `json:"issue"`
	Activity redmine.IdName `json:"activity"`
	Hours    float32        `json:"hours"`
	SpentOn  string         `json:"spent_on"`
}

type SpentOnIssueActivity struct {
	Issue    int
	Activity redmine.IdName
	Hours    float32
	SpentOn  string
}

func getIssueActivityPairs(issues *redmine.IssuesRes, issueActivities []IssueActivity) []IssueActivityResponse {
	issuesMap := make(map[int]redmine.Issue)
	for _, issue := range issues.Issues {
		issuesMap[issue.Id] = issue
	}

	var recentIssues []IssueActivityResponse

	for _, issueAct := range issueActivities {
		recentIssues = append(recentIssues,
			IssueActivityResponse{Issue: issuesMap[issueAct.Issue],
				Activity: issueAct.Activity})
	}
	return recentIssues

}

// loginHandler godoc
// @Summary Log in a user
// @Description Log in a user using the Redmine API
// @Security BasicAuth
// @Accept  json
// @Produce  json
// @Success 200 {object} LoginResponse
// @Failure 401 {string} error "Unauthorized"
// @Router /api/login [post]
func loginHandler(c *fiber.Ctx) error {
	sess, err := store.Get(c)
	if err != nil {
		log.Errorf("Failed to get session: %s", err)
		return c.SendStatus(500)
	}
	authHeader := c.Get("Authorization")
	user, err := redmine.Login(authHeader)
	if err != nil {
		log.Info("Log in failed")
		return c.SendStatus(401)
	}
	sess.Set("user", &user)
	err = sess.Save()
	if err != nil {
		log.Errorf("Failed to save session: %s", err)
	}
	log.Debugf("Logged in user %v", user)
	return c.JSON(LoginResponse{Login: user.Login, UserId: user.Id})
}

// logoutHandler godoc
// @Summary Log out a user
// @Description Log out a user by destroying the session
// @Accept  json
// @Produce  json
// @Success 200 {string} error "OK"
// @Failure 500 {string} error "Internal Server Error"
// @Router /api/logout [post]
func logoutHandler(c *fiber.Ctx) error {
	sess, err := store.Get(c)
	if err != nil {
		log.Errorf("Failed to get session: %s", err)
		return c.SendStatus(500)
	}
	err = sess.Destroy()
	if err != nil {
		log.Errorf("Failed to destroy session: %s", err)
		return c.SendStatus(500)
	}
	return c.SendStatus(200)
}

// recentIssuesHandler godoc
// @Summary get issues that the user has spent time on
// @Description get recent issues
// @Param Cookie header string true "default"
// @Accept  json
// @Produce  json
// @Success 200 {array} IssueActivityResponse
// @Failure 401 {string} error "Unauthorized"
// @Failure 500 {string} error "Internal Server Error"
// @Router /api/recent_issues [get]
func recentIssuesHandler(c *fiber.Ctx) error {
	user, err := getUser(c)
	if err != nil {
		log.Errorf("Failed to get session: %v", err)
		return c.SendStatus(401)
	}
	timeEntries, err := redmine.GetTimeEntries(user.ApiKey, nil, nil, nil, nil)
	if err != nil {
		log.Errorf("Failed to get recent entries: %v", err)
		c.Response().SetBodyString(err.Error())
		return c.SendStatus(500)
	}

	seen := make(map[IssueActivity]int)
	var issueIds []string
	var issueActivities []IssueActivity

	for _, entry := range timeEntries.TimeEntries {
		issueAct := IssueActivity{Issue: entry.Issue.Id, Activity: redmine.IdName{Id: entry.Activity.Id, Name: entry.Activity.Name}}
		seen[issueAct]++
		if seen[issueAct] == 1 {
			issueIds = append(issueIds, strconv.Itoa(entry.Issue.Id))
			issueActivities = append(issueActivities, issueAct)
		}
	}

	issues, err := redmine.GetIssues(user.ApiKey, issueIds)
	if err != nil {
		log.Errorf("Failed to get recent issues: %v", err)
		c.Response().SetBodyString(err.Error())
		return c.SendStatus(500)
	}

	return c.JSON(getIssueActivityPairs(issues, issueActivities))
}

// getTimeEntriesHandler godoc
// @Summary Proxy for the "/time_entries.json" Redmine endpoint
// @Description get time entries
// @Param Cookie header string true "default"
// @Param from query string false "start date"
// @Param to query string false "end date"
// @Param spent_on string false "date"
// @Param issue_id query int false "Redmine issue ID"
// @Param activity_id query int false "Redmine activity ID"
// @Accept  json
// @Produce  json
// @Success 200 {array} redmine.FetchedTimeEntry
// @Failure 401 {string} error "Unauthorized"
// @Failure 500 {string} error "Internal Server Error"
// @Router /api/time_entries [get]
func getTimeEntriesHandler(c *fiber.Ctx) error {
	user, err := getUser(c)
	if err != nil {
		log.Errorf("Failed to get session: %v", err)
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	// Add the API key to the headers.
	c.Request().Header.Set("X-Redmine-API-Key", user.ApiKey)

	redmineURL := fmt.Sprintf("%s:%s/time_entries.json?user_id=me&%s",
		config.Config.Redmine.Host, config.Config.Redmine.Port,
		c.Request().URI().QueryString())

	// Proxy the request to Redmine
	return proxy.Do(c, redmineURL)
}

// postTimeEntriesHandler godoc
// @Summary report time spent on an issue
// @Description report time spent on an issue
// @Param time_entry body redmine.TimeEntry true "urdr_session=default"
// @Param Cookie header string true "default"
// @Accept  json
// @Produce  json
// @Success 200 {string} error "OK"
// @Failure 401 {string} error "Unauthorized"
// @Failure 500 {string} error "Internal Server Error"
// @Router /api/time_entries [post]
func postTimeEntriesHandler(c *fiber.Ctx) error {
	user, err := getUser(c)
	if err != nil {
		log.Errorf("Failed to get session: %v", err)
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	// Try pulling out the "id" and "hours" from the request, then
	// decide how to proxy the request to Redmine.

	query := struct {
		TimeEntry struct {
			Id    int     `json:"id"`
			Hours float32 `json:"hours"`
		} `json:"time_entry"`
	}{}

	if err := json.Unmarshal(c.Request().Body(), &query); err != nil {
		c.Response().Reset()
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	// Add the API key to the headers.
	c.Request().Header.Set("X-Redmine-API-Key", user.ApiKey)

	// If the method remains empty, we won't send anything to
	// Redmine.
	method := ""
	redmineURL := fmt.Sprintf("%s:%s/time_entries",
		config.Config.Redmine.Host, config.Config.Redmine.Port)

	if query.TimeEntry.Id == 0 {
		if query.TimeEntry.Hours > 0 {
			// Create time entry.
			method = fiber.MethodPost
			redmineURL += ".json"
		} // else ignore
	} else {
		redmineURL += fmt.Sprintf("/%d.json", query.TimeEntry.Id)
		if query.TimeEntry.Hours > 0 {
			// Update time entry.
			method = fiber.MethodPut
		} else {
			// Delete time entry.
			method = fiber.MethodDelete
		}
	}

	if method == "" {
		// Just give back an OK (204, "No Content")
		c.Response().Reset()
		return c.SendStatus(fiber.StatusNoContent)
	}

	// Set correct method before proxying.
	c.Request().Header.SetMethod(method)

	log.Debugln(redmineURL, string(c.Request().Body()))

	return proxy.Do(c, redmineURL)
}
