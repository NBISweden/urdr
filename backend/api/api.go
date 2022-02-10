package api

import (
	cfg "urdr-api/internal/config"
	redmine "urdr-api/internal/redmine"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	log "github.com/sirupsen/logrus"
)

func Setup(redmineConf cfg.RedmineConfig) *fiber.App {
	// Fiber instance
	app := fiber.New()
	// Or extend your config for customization
	app.Use(cors.New(cors.Config{
		AllowCredentials: true,
	}))

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Hello, World!")
	})

	app.Get("/issues", func(c *fiber.Ctx) error {
		issuesJson, err := redmine.ListIssues(redmineConf)
		if err != nil {
			c.Response().SetBodyString(err.Error())
			return c.SendStatus(500)
		}
		return c.JSON(issuesJson)
	})

	app.Post("/api/login", func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		res := redmine.Login(authHeader, redmineConf)
		if res == true {
			log.Info("Logged in user")
			return c.SendStatus(200)
		} else {
			log.Info("Log in failed")
			return c.SendStatus(401)
		}
	})

	app.Post("/api/report", func(c *fiber.Ctx) error {
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
