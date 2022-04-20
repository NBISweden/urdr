package api

import (
	"encoding/json"
	"fmt"
	"sort"
	"urdr-api/internal/config"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
)

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
	if err := proxy.Do(c, redmineURL); err != nil {
		return err
	} else if c.Response().StatusCode() != fiber.StatusOK {
		return nil
	}

	activitiesResponse := struct {
		TimeEntryActivities []struct {
			Id        int    `json:"id"`
			Name      string `json:"name"`
			IsDefault bool   `json:"is_default"`
			Active    bool   `json:"active"`
		} `json:"time_entry_activities"`
	}{}

	if err := json.Unmarshal(c.Response().Body(), &activitiesResponse); err != nil {
		c.Response().Reset()
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	// Sort the activities list alphabetically on the name.
	sort.Slice(activitiesResponse.TimeEntryActivities, func(i, j int) bool {
		return activitiesResponse.TimeEntryActivities[i].Name < activitiesResponse.TimeEntryActivities[j].Name
	})

	return c.JSON(activitiesResponse)
}
