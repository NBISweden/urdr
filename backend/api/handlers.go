package api

import (
	"strconv"
	"urdr-api/internal/redmine"

	_ "urdr-api/docs"

	"github.com/gofiber/fiber/v2"
	log "github.com/sirupsen/logrus"
)

const defaultDate = "1970-01-01"

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
}

type SpentOnIssueActivity struct {
	Issue    int
	Activity redmine.IdName
	Hours    float32
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

func getSpentOnIssueActivities(issues *redmine.IssuesRes, issueActivities []SpentOnIssueActivity) []SpentOnIssueActivityResponse {
	issuesMap := make(map[int]redmine.Issue)
	for _, issue := range issues.Issues {
		issuesMap[issue.Id] = issue
	}

	var recentIssues []SpentOnIssueActivityResponse

	for _, issueAct := range issueActivities {
		recentIssues = append(recentIssues,
			SpentOnIssueActivityResponse{Issue: issuesMap[issueAct.Issue],
				Activity: issueAct.Activity, Hours: issueAct.Hours})
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
// @Summary get recent issues
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
	timeEntries, err := redmine.GetTimeEntries(user.ApiKey)
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

// spentTimeWithinDateRangeHandler godoc
// @Summary get time entries within a given time period
// @Description get time entries within start and end dates
// @Param Cookie header string true "default"
// @Param start_date query string true "start date"
// @Param end_date query string true "end date"
// @Accept  json
// @Produce  json
// @Success 200 {array} SpentOnIssueActivityResponse
// @Failure 401 {string} error "Unauthorized"
// @Failure 500 {string} error "Internal Server Error"
// @Router /api/spent_time [get]
func spentTimeWithinDateRangeHandler(c *fiber.Ctx) error {
	user, err := getUser(c)
	if err != nil {
		log.Errorf("Failed to get session: %v", err)
		return c.SendStatus(401)
	}
	startDate := c.Query("start_date", defaultDate)
	endDate := c.Query("end_date", defaultDate)

	timeEntries, err := redmine.GetTimeEntriesWithinDateRange(user.ApiKey, startDate, endDate)
	if err != nil {
		log.Errorf("Failed to get recent entries: %v", err)
		return c.SendStatus(500)
	}
	var issueIds []string
	var issueActivities []SpentOnIssueActivity

	for _, entry := range timeEntries.TimeEntries {
		issueAct := SpentOnIssueActivity{Issue: entry.Issue.Id, Hours: entry.Hours, Activity: redmine.IdName{Id: entry.Activity.Id, Name: entry.Activity.Name}}
		issueIds = append(issueIds, strconv.Itoa(entry.Issue.Id))
		issueActivities = append(issueActivities, issueAct)
	}

	issues, err := redmine.GetIssues(user.ApiKey, issueIds)
	if err != nil {
		log.Errorf("Failed to get issues: %v", err)
		return c.SendStatus(500)
	}
	return c.JSON(getSpentOnIssueActivities(issues, issueActivities))
}

// timeReportHandler godoc
// @Summary report time spent on issues
// @Description report time spent on issues
// @Param time_entry body redmine.TimeEntry true "urdr_session=default"
// @Param Cookie header string true "default"
// @Accept  json
// @Produce  json
// @Success 200 {string} error "OK"
// @Failure 401 {string} error "Unauthorized"
// @Router /api/report [post]
func timeReportHandler(c *fiber.Ctx) error {
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
		return c.SendStatus(401)
	}
}
