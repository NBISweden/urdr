package api

import (
	"strconv"
	"urdr-api/internal/redmine"

	_ "urdr-api/docs"

	"github.com/gofiber/fiber/v2"
	log "github.com/sirupsen/logrus"
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
	timeEntries, err := redmine.GetTimeEntries(user.ApiKey,nil,nil,nil,nil)
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
// @Summary get time entries for an issue+activity within a given time period
// @Description get time entries within start and end dates
// @Param Cookie header string true "default"
// @Param start_date query string false "start date"
// @Param end_date query string false "end date"
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
		return c.SendStatus(401)
	}
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")
	issueIdStr := c.Query("issue_id")
	activityIdStr := c.Query("activity_id")

	var startDate *string
	if startDateStr != "" {
		startDate = &startDateStr
	}
	var endDate *string
	if endDateStr != "" {
		endDate =  &endDateStr
	}
	var issueId *int
	if issueIdStr != "" {
		val, _ := strconv.Atoi(issueIdStr)
		issueId = &val
	}
	var activityId *int
	if activityIdStr != "" {
		val, _ := strconv.Atoi(activityIdStr)
		activityId = &val
	}

	timeEntries, err := redmine.GetTimeEntries(user.ApiKey, startDate, endDate, issueId, activityId)
	if err != nil {
		log.Errorf("Failed to get recent entries: %v", err)
		return c.SendStatus(500)
	}

	return c.JSON(timeEntries)
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
		return c.SendStatus(401)
	}
	var r redmine.TimeEntry
	err = c.BodyParser(&r)

	if err != nil {
		return err
	}

	log.Infof("Received time entry: %#v", r)

	err = redmine.CreateTimeEntry(r, user.ApiKey)
	if err == nil {
		log.Info("time entry created")
		return c.SendStatus(200)
	} else {
		log.Info("time entry creation failed")
		return c.SendStatus(500)
	}
}
