package api

import (
	"time"

	fiberSwagger "github.com/swaggo/fiber-swagger"

	_ "urdr-api/docs"
	"urdr-api/internal/config"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/session"
	"github.com/gofiber/storage/sqlite3"
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

	storage := sqlite3.New(sqlite3.Config{
		Database:   config.Config.App.SessionDBPath,
		Table:      "session",
		GCInterval: 1 * time.Hour,
	})

	store = session.New(session.Config{
		Expiration:     (7 * 24 /* A week in hours */) * time.Hour,
		KeyLookup:      "cookie:urdr_session",
		CookieSecure:   true,
		CookieSameSite: "Strict",
		Storage:        storage,
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
