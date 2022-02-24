package api

import (
	"errors"
	"time"
	cfg "urdr-api/internal/config"
	"urdr-api/internal/database"
	"urdr-api/internal/redmine"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/session"
	"github.com/gofiber/fiber/v2/utils"
	log "github.com/sirupsen/logrus"
)

func isUserLoggedIn(c *fiber.Ctx, store *session.Store) (bool, error) {
	sess, err := store.Get(c)
	if err != nil {
		return false, err
	}
	key := sess.Get("api_key")
	return key != nil, nil
}

func getSessionApiKey(c *fiber.Ctx, store *session.Store) (string, error) {
	sess, err := store.Get(c)
	if err != nil {
		return "", err
	}
	key := sess.Get("api_key")
	if key == nil {
		return "", errors.New("No session api key found")
	}
	return key.(string), nil
}

func Setup(redmineConf cfg.RedmineConfig) *fiber.App {
	// Fiber instance
	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowCredentials: true,
	}))

	store := session.New(session.Config{
		Expiration:     time.Minute * 5,
		CookieName:     "urdr_session",
		CookieDomain:   "",
		CookiePath:     "",
		CookieSecure:   true,
		CookieHTTPOnly: false,
		CookieSameSite: "none",
		KeyGenerator:   utils.UUID,
	})

	app.Post("/api/login", func(c *fiber.Ctx) error {
		sess, err := store.Get(c)
		if err != nil {
			log.Errorf("Failed to get session: %s", err)
			return c.SendStatus(500)
		}
		authHeader := c.Get("Authorization")
		apiKey, err := redmine.Login(redmineConf, authHeader)
		if err != nil {
			log.Info("Log in failed")
			return c.SendStatus(401)
		}
		sess.Set("api_key", apiKey)
		err = sess.Save()
		if err != nil {
			log.Errorf("Failed to save session: %s", err)
		}
		log.Info("Logged in user")
		return c.SendStatus(200)
	})

	app.Get("/api/logout", func(c *fiber.Ctx) error {
		sess, err := store.Get(c)
		if err != nil {
			log.Errorf("Failed to get session: %s", err)
			return c.SendStatus(500)
		}
		err = sess.Destroy()
		if err != nil {
			log.Errorf("Failed to destroy session: %s", err)
			return c.SendStatus(500)
		}
		return c.SendStatus(200)
	})

	app.Get("/api/issues", func(c *fiber.Ctx) error {
		apiKey, err := getSessionApiKey(c, store)
		if err != nil {
			log.Errorf("Failed to get session api key: %v", err)
			return c.SendStatus(401)
		}
		issuesJson, err := redmine.ListIssues(redmineConf, apiKey)
		if err != nil {
			c.Response().SetBodyString(err.Error())
			return c.SendStatus(500)
		}
		return c.JSON(issuesJson)
	})

	app.Post("/api/report", func(c *fiber.Ctx) error {
		apiKey, err := getSessionApiKey(c, store)
		if err != nil {
			log.Errorf("Failed to get session api key: %v", err)
			return c.SendStatus(401)
		}
		var r redmine.TimeEntry
		err = c.BodyParser(&r)

		if err != nil {
			return err
		}

		log.Infof("Received time entry: %#v", r)

		err = redmine.CreateTimeEntry(redmineConf, r, apiKey)
		if err == nil {
			log.Info("time entry created")
			return c.SendStatus(200)
		} else {
			log.Info("time entry creation failed")
			return c.SendStatus(401)
		}
	})

	app.Get("/api/user/setting/:name", func(c *fiber.Ctx) error {
		isUserLoggedIn, err := isUserLoggedIn(c, store)
		if !isUserLoggedIn {
			log.Error(err)
			return c.SendStatus(401)
		}
		redmineUserId := 250
		settingJson, err := database.GetUserSetting(redmineUserId, c.Params("name"))
		if err != nil {
			c.Response().SetBodyString(err.Error())
			return c.SendStatus(500)
		}
		return c.JSON(settingJson)
	})

	app.Get("/api/user/setting/:name/value/:value", func(c *fiber.Ctx) error {
		isUserLoggedIn, err := isUserLoggedIn(c, store)
		if !isUserLoggedIn {
			log.Error(err)
			return c.SendStatus(401)
		}
		redmineUserId := 250 //should be replaced by the user id
		name := c.Params("name")
		value := c.Params("value")
		dbErr := database.SetUserSetting(redmineUserId, name, value)
		if err != nil {
			c.Response().SetBodyString(dbErr.Error())
			return c.SendStatus(500)
		}
		return c.SendStatus(200)

	})

	// 404 Handler
	app.Use(func(c *fiber.Ctx) error {
		return c.SendStatus(404) // => 404 "Not Found"
	})

	// Return the configured app
	return app
}
