package api

import (
	"github.com/gofiber/fiber/v2"
	log "github.com/sirupsen/logrus"
)

// getUserGroupsHandler() godoc
// @Summary	Get user ids of groups a user belongs to
// @Description	Get the user ids of the users belonging to our user´s groups
// @Accept	json
// @Produce	json
// @Success	200	{array}	PriorityEntry
// @Failure	401	{string} error "Unauthorized"
// @Failure	500	{string} error "Internal Server Error"
// @Router /api/users_in_groups [get]
func getUserGroupsHandler(c *fiber.Ctx) error {
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

	dbGroupIds, err := db.GetUserGroups(userId.(int))
	if err != nil {
		log.Errorf("Failed to get user group ids for user ID %d: %v", userId.(int), err)
		return c.SendStatus(fiber.StatusInternalServerError)
	} else if len(dbGroupIds) == 0 {
		return c.JSON([]struct{}{})
	}

	var groupUserIds []int

	for _, gid := range dbGroupIds {
		users, err := db.GetUsersInGroup(gid)

		if err != nil {
			log.Errorf("Failed to get users in group", err)
			return c.SendStatus(fiber.StatusInternalServerError)
		}

		for _, user := range users {
			groupUserIds = append(groupUserIds, user)
		}
	}

	return c.JSON(groupUserIds)
}
