package api

import (
	"time"
	cfg "urdr-api/internal/config"
	redmine "urdr-api/internal/redmine"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/session"
	"github.com/gofiber/fiber/v2/utils"
	log "github.com/sirupsen/logrus"
)

func isLoggedIn(c *fiber.Ctx, store *session.Store) bool {
	sess, err := store.Get(c)
	if err != nil {
		log.Errorf("Failed to get session: %s", err)
	}
	if (sess.Get("is_logged_in")) != true {
		return false
	}
	return true
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
		CookieSameSite: "Lax",
		KeyGenerator:   utils.UUID,
	})

	app.Get("/", func(c *fiber.Ctx) error {
		if !isLoggedIn(c, store) {
			return c.SendStatus(401)
		}
		return c.SendString("Hello, World!")
	})

	app.Post("/api/login", func(c *fiber.Ctx) error {
		sess, err := store.Get(c)
		if err != nil {
			log.Errorf("Failed to get session: %s", err)
			return c.SendStatus(500)
		}
		authHeader := c.Get("Authorization")
		is_logged_in := redmine.Login(authHeader, redmineConf)
		if is_logged_in {
			sess.Set("is_logged_in", true)
			err = sess.Save()
			if err != nil {
				log.Errorf("Failed to save session: %s", err)
			}
			log.Info("Logged in user")
			return c.SendStatus(200)
		} else {
			log.Info("Log in failed")
			return c.SendStatus(401)
		}
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
		if isLoggedIn(c, store) == false {
			return c.SendStatus(401)
		}
		issuesJson, err := redmine.ListIssues(redmineConf)
		if err != nil {
			c.Response().SetBodyString(err.Error())
			return c.SendStatus(500)
		}
		return c.JSON(issuesJson)
	})

	app.Post("/api/report", func(c *fiber.Ctx) error {
		if isLoggedIn(c, store) == false {
			return c.SendStatus(401)
		}
		var r redmine.TimeEntry
		err := c.BodyParser(&r)

		if err != nil {
			return err
		}

		log.Infof("Received time entry: %s", r)

		err = redmine.CreateTimeEntry(redmineConf, r)
		if err == nil {
			log.Info("time entry created")
			return c.SendStatus(200)
		} else {
			log.Info("time entry creation failed")
			return c.SendStatus(401)
		}
	})

	// 404 Handler
	app.Use(func(c *fiber.Ctx) error {
		return c.SendStatus(404) // => 404 "Not Found"
	})

	// Return the configured app
	return app
}
