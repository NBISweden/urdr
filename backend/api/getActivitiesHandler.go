package api

import (
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"urdr-api/internal/config"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
)

type TimeEntryActivityResponse struct {
	TimeEntryActivities []struct {
		Id        int    `json:"id"`
		Name      string `json:"name"`
		IsDefault bool   `json:"is_default"`
		Active    bool   `json:"active"`
	} `json:"time_entry_activities"`
}

// getActivitiesHandler godoc
// @Summary	(Mostly) a proxy for the "/enumerations/time_entry_activities.json" Redmine endpoint
// @Accept	json
// @Produce	json
// @Failure	401	{string}	error "Unauthorized"
// @Failure	500	{string}	error "Internal Server Error"
// @Router	/api/activities	[get]
// @Param	session_id	query	string	false	"Issue ID"	default(0)
func getActivitiesHandler(c *fiber.Ctx) error {
	redmineIssueId, err := strconv.Atoi(c.Query("issue_id", "0"))
	if err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	if ok, err := prepareRedmineRequest(c); !ok {
		return err
	}

	redmineURL := fmt.Sprintf("%s/enumerations/time_entry_activities.json",
		config.Config.Redmine.URL)

	// Proxy the request to Redmine
	if err := proxy.Do(c, redmineURL); err != nil {
		return err
	} else if c.Response().StatusCode() != fiber.StatusOK {
		return nil
	}

	activitiesResponse := TimeEntryActivityResponse{}

	if err := json.Unmarshal(c.Response().Body(), &activitiesResponse); err != nil {
		c.Response().Reset()
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	// Sort the activities list alphabetically on the name.
	sort.Slice(activitiesResponse.TimeEntryActivities, func(i, j int) bool {
		return activitiesResponse.TimeEntryActivities[i].Name <
			activitiesResponse.TimeEntryActivities[j].Name
	})

	// Bypass filtering if we don't have a real issue ID.
	if redmineIssueId == 0 {
		// Return all activities.
		return c.JSON(activitiesResponse)
	}

	filteredActivities := TimeEntryActivityResponse{}

	for _, activity := range activitiesResponse.TimeEntryActivities {
		if db.IsValidEntry(redmineIssueId, activity.Id) {
			filteredActivities.TimeEntryActivities =
				append(filteredActivities.TimeEntryActivities, activity)
		}
	}

	return c.JSON(filteredActivities)
}
