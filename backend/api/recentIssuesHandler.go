package api

import (
	"encoding/json"
	"fmt"
	"sort"

	"github.com/gofiber/fiber/v2"
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
	// This handler should return a list of unique pairs of issues
	// and activities.  These should be taken from the Redmine
	// issues that the user has recently logged time on (we look at
	// the most recent 100 time entries), and from the issues that
	// the user is assigned to.

	// Start by getting the most recent time entries.  We add a
	// sorting and a limiting parameter to the request to make sure
	// that we get the 100 most recent entries with regards to the
	// "spent_on" value.

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

	seenIssues := make(map[int]bool)

	for _, entry := range timeEntriesResponse.TimeEntries {
		if !seenEntries[entry] {
			seenEntries[entry] = true
			entries = append(entries, entry)

			if !seenIssues[entry.Issue.Id] {
				seenIssues[entry.Issue.Id] = true
			}
		}
	}

	// Then get all (well, at least the newest 100) open issues that
	// are assigned to the user.

	c.Request().URI().SetQueryString("limit=100&assigned_to_id=me&status_id=open")

	if err := getIssuesHandler(c); err != nil {
		return err
	} else if c.Response().StatusCode() != fiber.StatusOK {
		return nil
	}

	issuesResponse := struct {
		Issues []Issue `json:"issues"`
	}{}

	if err := json.Unmarshal(c.Response().Body(), &issuesResponse); err != nil {
		c.Response().Reset()
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	// Go through the list of issues that the user has been assigned
	// to, and add the ones that we haven't already seen.  Note
	// that the issue will be aded to our entries list without an
	// associated activity.

	for _, issue := range issuesResponse.Issues {
		if !seenIssues[issue.Id] {
			entries = append(entries, Entry{Issue: issue})
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

	return c.JSON(entries)
}
