package api

import (
	"github.com/gofiber/fiber/v2"
	log "github.com/sirupsen/logrus"
)

// getGroupsHandler() godoc
// @Summary	Get group info from user
// @Description	Get the group id and name from user´s groups
// @Accept	json
// @Produce	json
// @Success	200	{array}	PriorityEntry
// @Failure	401	{string} error "Unauthorized"
// @Failure	500	{string} error "Internal Server Error"
// @Router /api/groups [get]
func getGroupsHandler(c *fiber.Ctx) error {
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

	dbGroups, err := db.GetUserGroups(userId.(int))
	if err != nil {
		log.Errorf("Failed to get user group ids for user ID %d: %v", userId.(int), err)
		return c.SendStatus(fiber.StatusInternalServerError)
	} else if len(dbGroups) == 0 {
		return c.JSON([]struct{}{})
	}

	return c.JSON(dbGroups)
}
