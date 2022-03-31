package api

import (
	"github.com/gofiber/fiber/v2"
	log "github.com/sirupsen/logrus"
)

// logoutHandler godoc
// @Summary	Log out a user
// @Description	Log out a user by destroying the session
// @Accept	json
// @Produce	json
// @Success	204	{string}	error "No Content"
// @Failure	401	{string}	error "Unauthorized"
// @Failure	500	{string}	error "Internal Server Error"
// @Router /api/logout [post]
func logoutHandler(c *fiber.Ctx) error {
	session, err := store.Get(c)
	if err != nil {
		log.Errorf("Failed to get session: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	if ApiKey := session.Get("api_key"); ApiKey == nil {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	if err := session.Destroy(); err != nil {
		log.Errorf("Failed to destroy session: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.SendStatus(fiber.StatusNoContent)
}
