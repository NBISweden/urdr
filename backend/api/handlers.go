package api

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
	log "github.com/sirupsen/logrus"

	_ "urdr-api/docs"

	"urdr-api/internal/config"
	"urdr-api/internal/database"
)

// prepareRedmineRequest() gets the Redmine API key out of the current
// session and adds it to the request headers.  It returns a false
// boolean value if there is an issue together with the the result of
// SendStatus().  This function was created by refactoring in VS Code
// (with minor fixes).
func prepareRedmineRequest(c *fiber.Ctx) (bool, error) {
	session, err := store.Get(c)
	if err != nil {
		log.Errorf("Failed to get session: %v", err)
		return false, c.SendStatus(fiber.StatusInternalServerError)
	}

	if apiKey := session.Get("api_key"); apiKey == nil {
		return false, c.SendStatus(fiber.StatusUnauthorized)
	} else {
		// Set the API key header.
		c.Request().Header.Set("X-Redmine-API-Key", apiKey.(string))
	}

	return true, nil
}

// fetchIssueSubjects() takes a list of issueActivity structs and
// proceeds to fill out the "subject" for each issue by querying
// Redmine.
func fetchIssueSubjects(c *fiber.Ctx, issueActivities []issueActivity) (bool, error) {
	if ok, err := prepareRedmineRequest(c); !ok {
		return false, err
	}

	seenIssueIds := make(map[int]bool)
	var issueIds []string

	for _, issueActivity := range issueActivities {
		issueId := issueActivity.Issue.Id
		if !seenIssueIds[issueId] {
			seenIssueIds[issueId] = true
			issueIds = append(issueIds, fmt.Sprintf("%d", issueId))
		}
	}

	// Do a request to the Redmine "/issues.json" endpoint to get
	// the issue subjects for the issue IDs in the issueIds list.

	c.Request().URI().SetQueryString(
		fmt.Sprintf("issue_id=%s", strings.Join(issueIds, ",")))

	c.Response().Reset()
	if err := getIssuesHandler(c); err != nil {
		return false, err
	} else if c.Response().StatusCode() != fiber.StatusOK {
		return false, nil
	}

	// Parse the response and fill out the subjects.

	issuesResponse := struct {
		Issues []issue `json:"issues"`
	}{}

	if err := json.Unmarshal(c.Response().Body(), &issuesResponse); err != nil {
		c.Response().Reset()
		return false, c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	// Iterate over our issueActivities list and fill in the missing
	// subject to each issue from the issuesResponse structure.

	for i := range issueActivities {
		for _, issue := range issuesResponse.Issues {
			if issue.Id == issueActivities[i].Issue.Id {
				issueActivities[i].Issue.Subject = issue.Subject
				break
			}
		}
	}

	return true, nil
}

type user struct {
	Login string `json:"login"`
}

// loginHandler godoc
// @Summary	Log in a user
// @Description	Log in a user using the Redmine API
// @Security	BasicAuth
// @Accept	json
// @Produce	json
// @Success	200	{object}	user
// @Failure	401	{string}	error "Unauthorized"
// @Failure	422	{string}	error "Unprocessable Entity"
// @Failure	500	{string}	error "Internal Server Error"
// @Router /api/login [post]
func loginHandler(c *fiber.Ctx) error {
	session, err := store.Get(c)
	if err != nil {
		log.Errorf("Failed to get session: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	// Redmine wants a GET request here, not a POST.
	c.Request().Header.SetMethod(fiber.MethodGet)

	redmineURL := fmt.Sprintf("%s/my/account.json",
		config.Config.Redmine.URL)

	if err := proxy.Do(c, redmineURL); err != nil {
		return err
	} else if c.Response().StatusCode() != fiber.StatusOK {
		return nil
	}

	loginResponse := struct {
		User struct {
			Id     int    `json:"id"`
			Login  string `json:"login"`
			ApiKey string `json:"api_key"`
		} `json:"user"`
	}{}

	if err := json.Unmarshal(c.Response().Body(), &loginResponse); err != nil {
		c.Response().Reset()
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	session.Set("user_id", loginResponse.User.Id)
	session.Set("api_key", loginResponse.User.ApiKey)

	if err := session.Save(); err != nil {
		log.Errorf("Failed to save session: %v", err)
	}

	log.Debugf("Logged in user %v", loginResponse)

	return c.JSON(user{
		Login: loginResponse.User.Login,
	})
}

// logoutHandler godoc
// @Summary	Log out a user
// @Description	Log out a user by destroying the session
// @Accept	json
// @Produce	json
// @Success	204	{string}	error "No Content"
// @Failure	401	{string}	error "Unauthorized"
// @Failure	500	{string}	error "Internal Server Error"
// @Router /api/logout [post]
func logoutHandler(c *fiber.Ctx) error {
	session, err := store.Get(c)
	if err != nil {
		log.Errorf("Failed to get session: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	if ApiKey := session.Get("api_key"); ApiKey == nil {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	if err := session.Destroy(); err != nil {
		log.Errorf("Failed to destroy session: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.SendStatus(fiber.StatusNoContent)
}

type issue struct {
	Id      int    `json:"id"`
	Subject string `json:"subject"`
}

type activity struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type issueActivity struct {
	Issue      issue    `json:"issue"`
	Activity   activity `json:"activity"`
	CustomName string   `json:"custom_name"`
}

// recentIssuesHandler godoc
// @Summary	Get recent issues
// @Description	Get recent issues that the user has spent time on
// @Accept	json
// @Produce	json
// @Success	200	{array}	issueActivity
// @Failure	401	{string} error "Unauthorized"
// @Failure	500	{string} error "Internal Server Error"
// @Router /api/recent_issues [get]
func recentIssuesHandler(c *fiber.Ctx) error {
	/* We want to return a list of pairs of issues and activities,
	   where where each issue and activity is an ID and a
	   name.  Unfortunately, the subject of the issue (its name,
	   essentially) is not included in the output from the Redmine
	   "/time_entries.json" endpoint, so we need to do a separate
	   call to the Redmine "/issues.json" endpoint to get these
	   strings. */

	// Start by getting the most recent time entries.  We add a
	// sorting parameter to the request to make sure that we get the
	// mest recent entries with regards to the "spent_on" value.

	c.Request().URI().SetQueryString("limit=100&sort=spent_on:desc")

	// The following sets the "X-Redmine-API-Key" header.
	if err := getTimeEntriesHandler(c); err != nil {
		return err
	} else if c.Response().StatusCode() != fiber.StatusOK {
		return nil
	}

	// Get unique pairings of issue IDs and activity IDs from the
	// response.

	timeEntriesResponse := struct {
		TimeEntries []issueActivity `json:"time_entries"`
	}{}

	if err := json.Unmarshal(c.Response().Body(), &timeEntriesResponse); err != nil {
		c.Response().Reset()
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	seenIssueActivities := make(map[issueActivity]bool)
	var issueActivities []issueActivity

	for _, issueActivity := range timeEntriesResponse.TimeEntries {
		if !seenIssueActivities[issueActivity] {
			seenIssueActivities[issueActivity] = true
			issueActivities = append(issueActivities, issueActivity)
		}
	}

	if ok, err := fetchIssueSubjects(c, issueActivities); !ok {
		return err
	}

	// Sort the issueActivities list on the issue IDs.
	sort.Slice(issueActivities, func(i, j int) bool {
		a := issueActivities[i]
		b := issueActivities[j]

		return (a.Issue.Id == b.Issue.Id && a.Activity.Id < b.Activity.Id) ||
			a.Issue.Id > b.Issue.Id
	})

	return c.JSON(issueActivities)
}

// getTimeEntriesHandler godoc
// @Summary	Proxy for the "/time_entries.json" Redmine endpoint
// @Accept	json
// @Produce	json
// @Failure	401	{string}	error "Unauthorized"
// @Failure	500	{string}	error "Internal Server Error"
// @Router /api/time_entries [get]
func getTimeEntriesHandler(c *fiber.Ctx) error {
	if ok, err := prepareRedmineRequest(c); !ok {
		return err
	}

	redmineURL := fmt.Sprintf("%s/time_entries.json?user_id=me&%s",
		config.Config.Redmine.URL, c.Request().URI().QueryString())

	// Proxy the request to Redmine
	return proxy.Do(c, redmineURL)
}

// postTimeEntriesHandler godoc
// @Summary	Create, update, or delete a time entry
// @Accept	json
// @Produce	json
// @Success	200	{string}	error "OK"
// @Failure	401	{string}	error "Unauthorized"
// @Failure	500	{string}	error "Internal Server Error"
// @Router /api/time_entries [post]
func postTimeEntriesHandler(c *fiber.Ctx) error {
	if ok, err := prepareRedmineRequest(c); !ok {
		return err
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
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	// If the method remains empty, we won't send anything to
	// Redmine.
	method := ""
	redmineURL := fmt.Sprintf("%s/time_entries",
		config.Config.Redmine.URL)

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
		return c.SendStatus(fiber.StatusNoContent)
	}

	// Set correct method before proxying.
	c.Request().Header.SetMethod(method)

	return proxy.Do(c, redmineURL)
}

// getIssuesHandler godoc
// @Summary	Proxy for the "/issues.json" Redmine endpoint
// @Accept	json
// @Produce	json
// @Failure	401	{string}	error "Unauthorized"
// @Failure	500	{string}	error "Internal Server Error"
// @Router /api/issues [get]
func getIssuesHandler(c *fiber.Ctx) error {
	if ok, err := prepareRedmineRequest(c); !ok {
		return err
	}

	redmineURL := fmt.Sprintf("%s/issues.json?%s",
		config.Config.Redmine.URL, c.Request().URI().QueryString())

	return proxy.Do(c, redmineURL)
}

// getActivitiesHandler godoc
// @Summary	Proxy for the "/enumerations/time_entry_activities.json" Redmine endpoint
// @Accept	json
// @Produce	json
// @Failure	401	{string}	error "Unauthorized"
// @Failure	500	{string}	error "Internal Server Error"
// @Router /api/activities [get]
func getActivitiesHandler(c *fiber.Ctx) error {
	if ok, err := prepareRedmineRequest(c); !ok {
		return err
	}

	redmineURL := fmt.Sprintf("%s/enumerations/time_entry_activities.json",
		config.Config.Redmine.URL)

	// Proxy the request to Redmine
	return proxy.Do(c, redmineURL)
}

func getFavoritesHandler(c *fiber.Ctx) error {
	session, err := store.Get(c)
	if err != nil {
		log.Errorf("Failed to get session: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	userId := session.Get("user_id")
	if userId == nil {
		log.Error("Failed to get vaid user ID from session")
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	db, err := database.New(config.Config.Database.Path)
	if err != nil {
		log.Errorf("Failed to connect to database: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	favorites, err := db.GetAllUserFavorites(userId.(int))
	if err != nil {
		log.Errorf("Failed to get favorites for user ID %d: %v", userId.(int), err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	var issueActivities []issueActivity

	for _, favorite := range favorites {
		issueActivity := issueActivity{
			Issue: issue{
				Id:      favorite.RedmineIssueId,
				Subject: "",
			},
			Activity: activity{
				Id:   favorite.RedmineActivityId,
				Name: "",
			},
			CustomName: favorite.Name,
		}

		issueActivities = append(issueActivities, issueActivity)
	}

	// Fetch the subjects for each issue.
	if ok, err := fetchIssueSubjects(c, issueActivities); !ok {
		return err
	}

	// Now fetch the activities from Redmine and fill out the
	// activity names.
	c.Response().Reset()
	if err := getActivitiesHandler(c); err != nil {
		return err
	} else if c.Response().StatusCode() != fiber.StatusOK {
		return nil
	}

	activitiesResponse := struct {
		Activities []struct {
			Id   int    `json:"id"`
			Name string `json:"name"`
		} `json:"time_entry_activities"`
	}{}

	if err := json.Unmarshal(c.Response().Body(), &activitiesResponse); err != nil {
		c.Response().Reset()
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	for i := range issueActivities {
		for _, activity := range activitiesResponse.Activities {
			if activity.Id == issueActivities[i].Activity.Id {
				issueActivities[i].Activity.Name = activity.Name
				break
			}
		}
	}

	return c.JSON(issueActivities)
}

func postFavoritesHandler(c *fiber.Ctx) error {
	// Parse the favoites from the query.
	query := []issueActivity{}

	if err := json.Unmarshal(c.Request().Body(), &query); err != nil {
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	session, err := store.Get(c)
	if err != nil {
		log.Errorf("Failed to get session: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	userId := session.Get("user_id")
	if userId == nil {
		log.Error("Failed to get vaid user ID from session")
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	db, err := database.New(config.Config.Database.Path)
	if err != nil {
		log.Errorf("Failed to connect to database: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	// Create a list of database.Favorite entries from the
	// parsed query.

	var favorites []database.Favorite

	for _, issueActivity := range query {
		favorite := database.Favorite{
			RedmineIssueId:    issueActivity.Issue.Id,
			RedmineActivityId: issueActivity.Activity.Id,
			Name:              issueActivity.CustomName,
		}

		favorites = append(favorites, favorite)
	}

	if err := db.SetAllUserFavorites(userId.(int), favorites); err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.SendStatus(fiber.StatusNoContent)
}
