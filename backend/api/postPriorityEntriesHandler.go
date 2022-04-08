package api

import (
	"encoding/json"
	"urdr-api/internal/database"

	"github.com/gofiber/fiber/v2"
	log "github.com/sirupsen/logrus"
)

// postPriorityEntriesHandler() godoc
// @Summary	Store priority entries (favorites or hidden issues)
// @Description	Stores the favorites and hidden issues for the current user
// @Accept	json
// @Produce	json
// @Success	204	{string} error "No Content"
// @Failure	401	{string} error "Unauthorized"
// @Failure	422	{string} error "Unprocessable Entity"
// @Failure	500	{string} error "Internal Server Error"
// @Router /api/priority_entries [post]
func postPriorityEntriesHandler(c *fiber.Ctx) error {
	session, err := store.Get(c)
	if err != nil {
		log.Errorf("Failed to get session: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	// The priority entries are stored with the user's ID.
	userId := session.Get("user_id")
	if userId == nil {
		log.Error("Failed to get valid user ID from session")
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	// Parse the entries from the query.
	query := []PriorityEntry{}

	if err := json.Unmarshal(c.Request().Body(), &query); err != nil {
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	// Create a list of database.PriorityEntry entries from the
	// parsed query.

	var dbPriorityEntries []database.PriorityEntry

	for _, priorityEntry := range query {
		dbPriorityEntry := database.PriorityEntry{
			RedmineIssueId:    priorityEntry.Issue.Id,
			RedmineActivityId: priorityEntry.Activity.Id,
			Name:              priorityEntry.CustomName,
			IsHidden:          priorityEntry.IsHidden,
		}

		dbPriorityEntries = append(dbPriorityEntries, dbPriorityEntry)
	}

	if err := db.SetAllUserPriorityEntries(userId.(int), dbPriorityEntries); err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.SendStatus(fiber.StatusNoContent)
}
