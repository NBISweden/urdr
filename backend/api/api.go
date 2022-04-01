package api

import (
	"time"

	fiberSwagger "github.com/swaggo/fiber-swagger"

	_ "urdr-api/docs"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/session"
)

var store *session.Store

// @title Urdr API
// @version 1.0
// @description This is the Urdr API.

// @contact.name National Bioinformatics Infrastructure Sweden
// @contact.url https://www.nbis.se

// @host localhost:8080
// @securityDefinitions.basic BasicAuth
// @BasePath /
func Setup() *fiber.App {

	// Fiber instance
	app := fiber.New()

	store = session.New(session.Config{
		Expiration:     (7 * 24 /* A week in hours */) * time.Hour,
		KeyLookup:      "cookie:urdr_session",
		CookieSecure:   true,
		CookieSameSite: "Strict",
	})

	app.Get("/swagger/*", fiberSwagger.WrapHandler)

	app.Post("/api/login", loginHandler)

	app.Post("/api/logout", logoutHandler)

	app.Get("/api/recent_issues", recentIssuesHandler)

	app.Get("/api/time_entries", getTimeEntriesHandler)

	app.Post("/api/time_entries", postTimeEntriesHandler)

	app.Get("/api/issues", getIssuesHandler)

	app.Get("/api/activities", getActivitiesHandler)

	app.Get("/api/priority_entries", getPriorityEntriesHandler)

	app.Post("/api/priority_entries", postPriorityEntriesHandler)

	// 404 Handler
	app.Use(func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusNotFound) // => 404 "Not Found"
	})

	// Return the configured app
	return app
}
