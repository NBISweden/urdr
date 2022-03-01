package api

import (
	"encoding/gob"
	"errors"
	"strconv"
	"time"
	cfg "urdr-api/internal/config"
	"urdr-api/internal/redmine"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/session"
	"github.com/gofiber/fiber/v2/utils"
	log "github.com/sirupsen/logrus"
)

const defaultDate = "1970-01-01"

func getUser(c *fiber.Ctx, store *session.Store) (*redmine.User, error) {
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

func Setup(redmineConf cfg.RedmineConfig) *fiber.App {

	gob.Register(&redmine.User{})

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

	app.Get("/swagger/*", fiberSwagger.WrapHandler)

	app.Post("/api/login", loginHandler)

	app.Post("/api/logout", logoutHandler)

	app.Get("/api/spent_time", spentTimeHandler)

	app.Post("/api/report", timeReportHandler)

	// 404 Handler
	app.Use(func(c *fiber.Ctx) error {
		return c.SendStatus(404) // => 404 "Not Found"
	})

	// Return the configured app
	return app
}
