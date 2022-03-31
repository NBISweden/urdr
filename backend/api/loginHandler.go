package api

import (
	"encoding/json"
	"fmt"
	"urdr-api/internal/config"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
	log "github.com/sirupsen/logrus"
)

// loginHandler godoc
// @Summary	Log in a user
// @Description	Log in a user using the Redmine API
// @Security	BasicAuth
// @Accept	json
// @Produce	json
// @Success	200	{object}	user
// @Failure	401	{string}	error "Unauthorized"
// @Failure	422	{string}	error "Unprocessable Entity"
// @Failure	500	{string}	error "Internal Server Error"
// @Router /api/login [post]
func loginHandler(c *fiber.Ctx) error {
	session, err := store.Get(c)
	if err != nil {
		log.Errorf("Failed to get session: %v", err)
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	// Redmine wants a GET request here, not a POST.
	c.Request().Header.SetMethod(fiber.MethodGet)

	redmineURL := fmt.Sprintf("%s/my/account.json",
		config.Config.Redmine.URL)

	if err := proxy.Do(c, redmineURL); err != nil {
		return err
	} else if c.Response().StatusCode() != fiber.StatusOK {
		return nil
	}

	loginResponse := struct {
		User struct {
			Id     int    `json:"id"`
			Login  string `json:"login"`
			ApiKey string `json:"api_key"`
		} `json:"user"`
	}{}

	if err := json.Unmarshal(c.Response().Body(), &loginResponse); err != nil {
		c.Response().Reset()
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	session.Set("user_id", loginResponse.User.Id)
	session.Set("api_key", loginResponse.User.ApiKey)

	if err := session.Save(); err != nil {
		log.Errorf("Failed to save session: %v", err)
	}

	log.Debugf("Logged in user %v", loginResponse)

	return c.JSON(user{
		Login: loginResponse.User.Login,
	})
}
