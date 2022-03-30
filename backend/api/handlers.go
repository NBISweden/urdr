package api

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	log "github.com/sirupsen/logrus"

	_ "urdr-api/docs"
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

// fetchIssueSubjects() takes a list of Entry structs and
// proceeds to fill out the "subject" for each issue by querying
// Redmine.
func fetchIssueSubjects(c *fiber.Ctx, entries []Entry) (bool, error) {
	if ok, err := prepareRedmineRequest(c); !ok {
		return false, err
	}

	seenIssueIds := make(map[int]bool)
	var issueIds []string

	for _, entry := range entries {
		if entry.Issue.Subject != "" {
			continue
		}
		issueId := entry.Issue.Id
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
		Issues []Issue `json:"issues"`
	}{}

	if err := json.Unmarshal(c.Response().Body(), &issuesResponse); err != nil {
		c.Response().Reset()
		return false, c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	// Iterate over our entries list and fill in the missing
	// subject to each issue from the issuesResponse structure.

	for i := range entries {
		if entries[i].Issue.Subject != "" {
			continue
		}
		for _, issue := range issuesResponse.Issues {
			if issue.Id == entries[i].Issue.Id {
				entries[i].Issue.Subject = issue.Subject
				break
			}
		}
	}

	return true, nil
}
