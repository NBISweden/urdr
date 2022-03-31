package api

import (
	"fmt"
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
	return proxy.Do(c, redmineURL)
}
