package api

import (
	"encoding/gob"
	"errors"
	"time"
	"urdr-api/internal/redmine"

	fiberSwagger "github.com/swaggo/fiber-swagger"

	_ "urdr-api/docs"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/session"
	"github.com/gofiber/fiber/v2/utils"
)

var store *session.Store

func getUser(c *fiber.Ctx) (*redmine.User, error) {
	sess, err := store.Get(c)
	if err != nil {
		return nil, err
	}
	user := sess.Get("user")
	if user == nil {
		return nil, errors.New("No session user found")
	}
	return user.(*redmine.User), nil
}

// @title Urdr API
// @version 1.0
// @description This is the Urdr API.

// @contact.name National Bioinformatics Infrastructure Sweden
// @contact.url https://www.nbis.se

// @host localhost:8080
// @securityDefinitions.basic BasicAuth
// @BasePath /
func Setup() *fiber.App {

	gob.Register(&redmine.User{})

	// Fiber instance
	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowCredentials: true,
	}))

	store = session.New(session.Config{
		Expiration:     time.Minute * 5,
		CookieName:     "urdr_session",
		CookieDomain:   "",
		CookiePath:     "",
		CookieSecure:   true,
		CookieHTTPOnly: false,
		CookieSameSite: "none",
		KeyGenerator:   utils.UUID,
	})

	app.Get("/swagger/*", fiberSwagger.WrapHandler)

	app.Post("/api/login", loginHandler)

	app.Post("/api/logout", logoutHandler)

	app.Get("/api/recent_issues", recentIssuesHandler)

	app.Get("/api/time_entries", getTimeEntriesHandler)

	app.Post("/api/time_entries", postTimeEntriesHandler)

	// 404 Handler
	app.Use(func(c *fiber.Ctx) error {
		return c.SendStatus(404) // => 404 "Not Found"
	})

	// Return the configured app
	return app
}
