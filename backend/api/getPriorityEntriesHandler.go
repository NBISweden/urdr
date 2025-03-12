package api

import (
	"encoding/json"
	"fmt"
	"urdr-api/internal/redmine"

	"github.com/gofiber/fiber/v2"
	log "github.com/sirupsen/logrus"
)

// getPriorityEntriesHandler() godoc
// @Summary	Get priority entries (favorites or hidden issues)
// @Description	Get the favorites and hidden issues for the current user
// @Accept	json
// @Produce	json
// @Success	200	{array}	PriorityEntry
// @Failure	401	{string} error "Unauthorized"
// @Failure	500	{string} error "Internal Server Error"
// @Router /api/priority_entries [get]
func getPriorityEntriesHandler(c *fiber.Ctx) error {
	session, err := store.Get(c)
	if err != nil {
		log.Errorf("Failed to get session: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	userId := session.Get("user_id")
	if userId == nil {
		log.Error("Failed to get valid user ID from session")
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	dbPriorityEntries, err := db.GetAllUserPrioityEntries(userId.(int))
	if err != nil {
		log.Errorf("Failed to get priority entries for user ID %d: %v", userId.(int), err)
		return c.SendStatus(fiber.StatusInternalServerError)
	} else if len(dbPriorityEntries) == 0 {
		// If there are no priority entries,
		// return empty array and bail out here.
		return c.JSON([]struct{}{})
	}

	var entries []Entry

	for _, dbPriorityEntry := range dbPriorityEntries {
		entry := Entry{
			Issue: Issue{
				Id: dbPriorityEntry.RedmineIssueId,
				Subject: dbPriorityEntry.RedmineIssueSubject,
				Project: Project{
					Id: dbPriorityEntry.RedmineProjectId,
				},
			},
			Activity: Activity{
				Id: dbPriorityEntry.RedmineActivityId,
				Name: dbPriorityEntry.RedmineActivityName,
			},
		}

		entries = append(entries, entry)
	}

	// Fetch the subjects for each issue.
	if ok, err := fetchIssueSubjects(c, entries); !ok {
		return err
	}

	var priorityEntries []PriorityEntry

        // If we're dealing with a priority entry that has no activity
        // name, because it was added before the activity name was
        // stored in the database, we need to fetch the activity name
        // from Redmine.  We also need to update the database with the
        // activity name.
	doUpdateDb := false

	for i, dbPriorityEntry := range dbPriorityEntries {
		priorityEntry := PriorityEntry{
			Issue:      entries[i].Issue,
			Activity:   entries[i].Activity,
			CustomName: dbPriorityEntry.Name,
			IsHidden:   dbPriorityEntry.IsHidden,
		}

		activityName := priorityEntry.Activity.Name
		if activityName == "" {
                        // The activity was stored in the database
                        // without a name.  Fetch the activity name from
                        // Redmine.  To do this, we may also need to
                        // fetch the project ID for the issue.

			projectId := priorityEntry.Issue.Project.Id
			if projectId == 0 {
				projectId, err = getProjectIdForIssue(c, priorityEntry.Issue.Id)
				if err != nil {
					return err
				}
			}
			dbPriorityEntries[i].RedmineProjectId = projectId

			activityName, err = getActivityNameForIssue(c, priorityEntry.Issue.Id, projectId, priorityEntry.Activity.Id)
			if err != nil {
				return err
			}
			dbPriorityEntries[i].RedmineActivityName = activityName
			priorityEntry.Activity.Name = activityName

			doUpdateDb = true
		}

		priorityEntries = append(priorityEntries, priorityEntry)
	}

	if doUpdateDb {
		if err := db.SetAllUserPriorityEntries(userId.(int), dbPriorityEntries); err != nil {
			return err
		}
	}

	return c.JSON(priorityEntries)
}

func getProjectIdForIssue(c *fiber.Ctx, issueId int) (int, error) {
	c.Response().Reset()
	c.Request().URI().SetQueryString(
		fmt.Sprintf("issue_id=%d&status_id=*", issueId))

	if err := getIssuesHandler(c); err != nil {
	} else if c.Response().StatusCode() != fiber.StatusOK {
		return 0, nil
	}
	issuesResponse := struct {
		Issues []Issue `json:"issues"`
	}{}
	if err := json.Unmarshal(c.Response().Body(), &issuesResponse); err != nil {
		c.Response().Reset()
		return 0, err
	}

	projectId := issuesResponse.Issues[0].Project.Id
	return projectId, nil

}

func getActivityNameForIssue(c *fiber.Ctx, issueId int, projectId int, activityId int) (string, error) {
	c.Response().Reset()
	c.Context().URI().SetQueryString(fmt.Sprintf("project_id=%d&issue_id=%d", projectId, issueId))
	if err := getProjectActivitiesHandler(c); err != nil {
		log.Errorf("Error getProjectActivitiesHandler %v", err)
		return "", err
	} else if c.Response().StatusCode() != fiber.StatusOK {
		log.Errorf("Error StatCode %v", err)
		return "", err
	}

	projectEntryResponse := redmine.Project{}

	if err := json.Unmarshal(c.Response().Body(), &projectEntryResponse); err != nil {
		c.Response().Reset()
		log.Errorf("Error Unmarshal projectEntryResponse %v", err)
		return "", err
	}

	activityName := ""
	for _, activity := range projectEntryResponse.TimeEntryActivities {
		if activity.Id == activityId {
			activityName = activity.Name
			break
		}
	}

	return activityName, nil
}
