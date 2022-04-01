package api

import (
	"encoding/json"
	"urdr-api/internal/config"
	"urdr-api/internal/database"

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

	db, err := database.New(config.Config.Database.Path)
	if err != nil {
		log.Errorf("Failed to connect to database: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
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
			},
			Activity: Activity{
				Id: dbPriorityEntry.RedmineActivityId,
			},
		}

		entries = append(entries, entry)
	}

	// Fetch the subjects for each issue.
	if ok, err := fetchIssueSubjects(c, entries); !ok {
		return err
	}

	// Now fetch the activities from Redmine and fill out the
	// activity names.
	c.Response().Reset()
	if err := getActivitiesHandler(c); err != nil {
		// There was some error in the handler.
		return err
	} else if c.Response().StatusCode() != fiber.StatusOK {
		// There was some error sent to us from Redmine.
		return nil
	}

	activitiesResponse := struct {
		Activities []struct {
			Id   int    `json:"id"`
			Name string `json:"name"`
		} `json:"time_entry_activities"`
	}{}

	if err := json.Unmarshal(c.Response().Body(), &activitiesResponse); err != nil {
		c.Response().Reset()
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	var priorityEntries []PriorityEntry

	for i, dbPriorityEntry := range dbPriorityEntries {
		priorityEntry := PriorityEntry{
			Issue:      entries[i].Issue,
			Activity:   entries[i].Activity,
			CustomName: dbPriorityEntry.Name,
			IsHidden:   dbPriorityEntry.IsHidden,
		}
		for _, activity := range activitiesResponse.Activities {
			if activity.Id == priorityEntry.Activity.Id {
				priorityEntry.Activity.Name = activity.Name
				break
			}
		}

		priorityEntries = append(priorityEntries, priorityEntry)
	}

	return c.JSON(priorityEntries)
}
