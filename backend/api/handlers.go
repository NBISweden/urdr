package api

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
	log "github.com/sirupsen/logrus"

	_ "urdr-api/docs"

	"urdr-api/internal/config"
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

	if ApiKey := session.Get("api_key"); ApiKey == nil {
		return false, c.SendStatus(fiber.StatusUnauthorized)
	} else {
		// Set the API key header.
		c.Request().Header.Set("X-Redmine-API-Key", ApiKey.(string))
	}

	return true, nil
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

	// session.Set("id", loginResponse.User.Id)
	// session.Set("login", loginResponse.User.Login)
	session.Set("api_key", loginResponse.User.ApiKey)

	if err := session.Save(); err != nil {
		log.Errorf("Failed to save session: %v", err)
	}

	log.Debugf("Logged in user %v", loginResponse)

	return c.JSON(struct {
		UserId int    `json:"user_id"`
		Login  string `json:"login"`
	}{
		UserId: loginResponse.User.Id,
		Login:  loginResponse.User.Login,
	})
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
	/* We want to return a list of pairs of issues and activities,
	   where where each issue and activity is an ID and a
	   name.  Unfortunately, the subject of the issue (its name,
	   essentially) is not included in the output from the Redmine
	   "/time_entries.json" endpoint, so we need to do a separate
	   call to the Redmine "/issues.json" endpoint to get these
	   strings. */

	/* Note that the way we do this is by calling our own
	   getTimeEntriesHandler() function and then parsing the result
	   from there.  This means that our frontend is allowed to pass
	   additional parameters to the Redmine "/time_entries.json"
	   endpoint if needed, e.g., to extend the limit on number of
	   returned entries, or to specify date filtering, etc. */

	// Start by getting the most recent time entries.
	// This also sets the "X-Redmine-API-Key" header.
	if err := getTimeEntriesHandler(c); err != nil {
		return err
	} else if c.Response().StatusCode() != fiber.StatusOK {
		return nil
	}

	// Get unique pairings of issue IDs and activity IDs from the
	// response.

	timeEntriesResponse := struct {
		TimeEntries []struct {
			Issue struct {
				Id int `json:"id"`
			} `json:"issue"`
			Activity struct {
				Id   int    `json:"id"`
				Name string `json:"name"`
			} `json:"activity"`
		} `json:"time_entries"`
	}{}

	if err := json.Unmarshal(c.Response().Body(), &timeEntriesResponse); err != nil {
		c.Response().Reset()
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	// We'll use the following IssueActivity type to create a list
	// of pairs of issues and activities that we later marshal into
	// a JSON response from this function.
	type IssueActivity struct {
		Issue struct {
			Id      int    `json:"id"`
			Subject string `json:"subject"`
		} `json:"issue"`
		Activity struct {
			Id   int    `json:"id"`
			Name string `json:"name"`
		} `json:"activity"`
	}

	seenIssueIds := make(map[int]bool)
	var issueIds []string

	seenIssueActivities := make(map[IssueActivity]bool)

	for _, entry := range timeEntriesResponse.TimeEntries {
		key := IssueActivity{}
		key.Issue.Id = entry.Issue.Id
		key.Activity.Id = entry.Activity.Id
		key.Activity.Name = entry.Activity.Name

		if !seenIssueActivities[key] {
			seenIssueActivities[key] = true

			if !seenIssueIds[key.Issue.Id] {
				seenIssueIds[key.Issue.Id] = true

				// We append the issue IDs as strings
				// to be able to conveniently create
				// a comma-delimited list using
				// strings.Join() later.
				issueIds = append(issueIds, fmt.Sprintf("%d", key.Issue.Id))
			}
		}
	}

	// Do a request to the Redmine "/issues.json" endpoint to get
	// the issue subjects for the issue IDs in the issueIds list.

	redmineURL := fmt.Sprintf("%s/issues.json?issue_id=%s",
		config.Config.Redmine.URL, strings.Join(issueIds, ","))

	if err := proxy.Do(c, redmineURL); err != nil {
		return err
	} else if c.Response().StatusCode() != fiber.StatusOK {
		return nil
	}

	// Parse the response and fill out the subjects in the structs
	// used as keys in the seenIssueActivities map.

	issuesResponse := struct {
		Issues []struct {
			Id      int    `json:"id"`
			Subject string `json:"subject"`
		} `json:"issues"`
	}{}

	if err := json.Unmarshal(c.Response().Body(), &issuesResponse); err != nil {
		c.Response().Reset()
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	var issueActivities []IssueActivity

	// Iterate over the *keys* of the seenIssueActivities map
	// and add the subject to each issue from the issuesResponse
	// structure.  Add the issueActivity with its now completed
	// issue to the issueActivities list for marshalling into JSON.

	for issueActivity := range seenIssueActivities {
		for _, entry := range issuesResponse.Issues {
			if entry.Id == issueActivity.Issue.Id {
				issueActivity.Issue.Subject = entry.Subject
				issueActivities = append(issueActivities, issueActivity)
				break
			}
		}
	}

	return c.JSON(issueActivities)
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
	if ok, err := prepareRedmineRequest(c); !ok {
		return err
	}

	redmineURL := fmt.Sprintf("%s/time_entries.json?user_id=me&%s",
		config.Config.Redmine.URL, c.Request().URI().QueryString())

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
