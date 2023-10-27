package api

import (
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"urdr-api/internal/config"
	"urdr-api/internal/redmine"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
)

// getActivitiesHandler godoc
// @Summary	Get a list of activities from the Redmine projects endpoint
// @Accept	json
// @Produce	json
// @Failure	401	{string}	error "Unauthorized"
// @Failure	500	{string}	error "Internal Server Error"
// @Router	/api/activities	[get]
// @Param	project_id	query	string	false	"Project ID"	default(0)
// @Param	issue_id	query	string	false	"Issue ID"	default(0)
func getProjectActivitiesHandler(c *fiber.Ctx) error {
	redmineProjectId, err := strconv.Atoi(c.Query("project_id", "0"))
	if err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}
	redmineIssueId, err := strconv.Atoi(c.Query("issue_id", "0"))
	if err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	if ok, err := prepareRedmineRequest(c); !ok {
		return err
	}

	var redmineURL string

	// If we don't have a real project ID, return an empty list of activities.
	if redmineProjectId == 0 {
		emptyListResponse := redmine.ProjectEntry{}
		return c.JSON(emptyListResponse)
	} else {
		redmineURL = fmt.Sprintf("%s/projects/%d.json?include=time_entry_activities",
			config.Config.Redmine.URL, redmineProjectId)
	}

	// Proxy the request to Redmine
	if err := proxy.Do(c, redmineURL); err != nil {
		return err
	} else if c.Response().StatusCode() != fiber.StatusOK {
		return nil
	}

	activitiesResponse := redmine.ProjectEntry{}

	if err := json.Unmarshal(c.Response().Body(), &activitiesResponse); err != nil {
		c.Response().Reset()
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	// Sort the activities list alphabetically on the name.
	sort.Slice(activitiesResponse.Project.TimeEntryActivities, func(i, j int) bool {
		return activitiesResponse.Project.TimeEntryActivities[i].Name <
			activitiesResponse.Project.TimeEntryActivities[j].Name
	})

	filteredActivities := redmine.ProjectEntry{}

	for _, activity := range activitiesResponse.Project.TimeEntryActivities {
		if db.IsValidEntry(redmineIssueId, activity.Id) {
			filteredActivities.Project.TimeEntryActivities =
				append(filteredActivities.Project.TimeEntryActivities, activity)
		}
	}

	return c.JSON(filteredActivities.Project)
}
