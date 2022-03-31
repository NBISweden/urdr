package api

import (
	"fmt"
	"urdr-api/internal/config"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
)

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
