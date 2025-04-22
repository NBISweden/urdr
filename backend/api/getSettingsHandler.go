package api

import (
	"github.com/gofiber/fiber/v2"
	log "github.com/sirupsen/logrus"
)

// getSettingsHandler() godoc
// @Summary      Get user-specific settings
// @Description  Get user-specific settings from local database
// @Accept      json
// @Produce     json
// @Success      200 {string} string
// @Failure      401 {string} error "Unauthorized"
// @Failure      500 {string} error "Internal Server Error"
// @Router       /api/settings [get]
// @Param	key query string true "Key to get settings for"
func getSettingsHandler(c *fiber.Ctx) error {
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

	key := c.Query("key")
	value, err := db.GetUserSetting(userID.(int), key)
	if err != nil {
		log.Errorf("Failed to get user settings: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.JSON(fiber.Map{
		"key":   key,
		"value": value,
	})
}
