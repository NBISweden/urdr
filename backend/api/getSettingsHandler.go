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
// @Success      200 {object} api.getSettingsHandler.settingResponse "User setting"
// @Failure      401 {string} error "Unauthorized"
// @Failure      500 {string} error "Internal Server Error"
// @Router       /api/setting [get]
// @Param	name query string true "Key to get settings for"
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

	name := c.Query("name")
	value, err := db.GetUserSetting(userID.(int), name)
	if err != nil {
		log.Errorf("Failed to get user settings: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	type settingResponse struct {
		Name  string `json:"name"`
		Value string `json:"value"`
	}
	return c.JSON(settingResponse{
		Name:  name,
		Value: value,
	})
}
