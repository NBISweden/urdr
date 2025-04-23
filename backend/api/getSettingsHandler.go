package api

import (
	"strconv"
	"strings"

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
// @Failure      400 {string} error "Bad Request"
// @Failure      500 {string} error "Internal Server Error"
// @Router       /api/setting [get]
// @Param	name query string true "Key to get settings for"
// @Param	user_id query int true "User ID(s) to get settings for (optional)"
func getSettingsHandler(c *fiber.Ctx) error {
	session, err := store.Get(c)
	if err != nil {
		log.Errorf("Failed to get session: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	var userIDs []int

	// Getting setting for current user, or some other (list) of user(s)?
	if c.Query("user_id") == "" {
		// If no user_id is provided, use the current user's ID
		userID := session.Get("user_id")
		if userID == nil {
			log.Error("Failed to get valid user ID from session")
			return c.SendStatus(fiber.StatusUnauthorized)
		}
		userIDs = append(userIDs, userID.(int))
	} else {
		// If user_id is provided, use it (split by comma)
		userIDStrs := c.Query("user_id")
		for _, userIDStr := range strings.Split(userIDStrs, ",") {
			userID, err := strconv.Atoi(userIDStr)
			if err != nil {
				log.Errorf("Failed to convert user_id to int: %v", err)
				return c.SendStatus(fiber.StatusBadRequest)
			}
			userIDs = append(userIDs, userID)
		}
	}

	type settingResponse struct {
		Id    int    `json:"id"`
		Name  string `json:"name"`
		Value string `json:"value"`
	}

	var settings []settingResponse

	name := c.Query("name")
	for _, userID := range userIDs {
		value, err := db.GetUserSetting(userID, name)
		if err != nil {
			log.Errorf("Failed to get user settings: %v", err)
			return c.SendStatus(fiber.StatusInternalServerError)
		}
		settings = append(settings, settingResponse{
			Id:    userID,
			Name:  name,
			Value: value,
		})
	}

	return c.JSON(settings)
}
