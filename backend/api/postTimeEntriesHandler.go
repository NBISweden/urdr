package api

import (
	"encoding/json"
	"fmt"
	"urdr-api/internal/config"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
)

// postTimeEntriesHandler godoc
// @Summary	Create, update, or delete a time entry
// @Accept	json
// @Produce	json
// @Success	200	{string}	error "OK"
// @Failure	401	{string}	error "Unauthorized"
// @Failure	500	{string}	error "Internal Server Error"
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
