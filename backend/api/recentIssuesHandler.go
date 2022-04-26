package api

import (
	"encoding/json"
	"fmt"
	"github.com/gofiber/fiber/v2"
	//log "github.com/sirupsen/logrus"
	"sort"
)

// recentIssuesHandler godoc
// @Summary	Get recent issues
// @Description	Get recent issues that the user has spent time on
// @Accept	json
// @Produce	json
// @Success	200	{array}	Entry
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

	c.Request().URI().SetQueryString(fmt.Sprintf("limit=100&sort=spent_on:desc&%s",
		c.Request().URI().QueryString()))

	// The following sets the "X-Redmine-API-Key" header.
	if err := getTimeEntriesHandler(c); err != nil {
		return err
	} else if c.Response().StatusCode() != fiber.StatusOK {
		return nil
	}

	// Get unique pairings of issue IDs and activity IDs from the
	// response.

	timeEntriesResponse := struct {
		TimeEntries []Entry `json:"time_entries"`
	}{}

	if err := json.Unmarshal(c.Response().Body(), &timeEntriesResponse); err != nil {
		c.Response().Reset()
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	seenEntries := make(map[Entry]bool)
	var entries []Entry

	for _, entry := range timeEntriesResponse.TimeEntries {
		if !seenEntries[entry] {
			seenEntries[entry] = true
			entries = append(entries, entry)
		}
	}

	// Populate the issue subjects.
	if ok, err := fetchIssueSubjects(c, entries); !ok {
		return err
	}

	// Sort the entries list on the issue IDs.
	sort.Slice(entries, func(i, j int) bool {
		a := entries[i]
		b := entries[j]

		return (a.Issue.Id == b.Issue.Id && a.Activity.Id < b.Activity.Id) ||
			a.Issue.Id > b.Issue.Id
	})
	//log.Debugf("ENTRIES: %v\n", entries)
	return c.JSON(entries)
}
