package api

import (
	"github.com/gofiber/fiber/v2"
	log "github.com/sirupsen/logrus"
)

// postSettingsHandler() godoc
// @Summary      Post user-specific settings
// @Description  Post user-specific settings to local database
// @Accept      json
// @Success      204 {string} string "No Content"
// @Failure      401 {string} error "Unauthorized"
// @Failure      500 {string} error "Internal Server Error"
// @Router       /api/setting [post]
// @Param	name query string true "Key to store value for"
// @Param	value query string true "Value to store for key"
func postSettingsHandler(c *fiber.Ctx) error {
	session, err := store.Get(c)
	if err != nil {
		log.Errorf("Failed to get session: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	userID := session.Get("user_id")
	if userID == nil {
		log.Error("Failed to get valid user ID from session")
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	name := c.Query("name")
	value := c.Query("value")

	err = db.SetUserSetting(userID.(int), name, value)
	if err != nil {
		log.Errorf("Failed to set user setting: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.SendStatus(fiber.StatusNoContent)
}
