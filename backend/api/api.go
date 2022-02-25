package api

import (
	"encoding/gob"
	"errors"
	"strconv"
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

func getSessionApiKey(c *fiber.Ctx, store *session.Store) (string, error) {
	user, err := getUser(c, store)
	if err != nil {
		return "", err
	}
	key := user.ApiKey
	if key == "" {
		return "", errors.New("No session api key found")
	}
	return key, nil
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

	app.Post("/api/login", func(c *fiber.Ctx) error {
		sess, err := store.Get(c)
		if err != nil {
			log.Errorf("Failed to get session: %s", err)
			return c.SendStatus(500)
		}
		authHeader := c.Get("Authorization")
		user, err := redmine.Login(redmineConf, authHeader)
		if err != nil {
			log.Info("Log in failed")
			return c.SendStatus(401)
		}
		log.Println(user)
		sess.Set("user", &user)
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

	app.Get("/api/spent_time", func(c *fiber.Ctx) error {

		apiKey, err := getSessionApiKey(c, store)
		if err != nil {
			log.Errorf("Failed to get session api key: %v", err)
			return c.SendStatus(401)
		}
		timeEntries, err := redmine.GetTimeEntries(redmineConf, apiKey, c.Query("start", defaultDate), c.Query("end", defaultDate))
		if err != nil {
			log.Errorf("Failed to get recent entries: %v", err)
			c.Response().SetBodyString(err.Error())
			return c.SendStatus(500)
		}

		seen := make(map[int]int)
		var issueIds []string

		for _, entry := range timeEntries.TimeEntries {
			seen[entry.Issue.Id]++
			if seen[entry.Issue.Id] == 1 {
				issueIds = append(issueIds, strconv.Itoa(entry.Issue.Id))
			}
		}

		issues, err := redmine.GetIssues(redmineConf, apiKey, issueIds)
		if err != nil {
			log.Errorf("Failed to get recent issues: %v", err)
			c.Response().SetBodyString(err.Error())
			return c.SendStatus(500)
		}
		type SpentTime struct {
			TimeEnt []redmine.FetchedTimeEntry `json:"time_spent"`
			Issues  []redmine.Issue            `json:"issues"`
		}
		var spent SpentTime
		spent.TimeEnt = timeEntries.TimeEntries
		spent.Issues = issues.Issues
		return c.JSON(spent)
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

	app.Get("/api/setting/:name", func(c *fiber.Ctx) error {
		user, err := getUser(c, store)
		if err != nil {
			log.Error(err)
			return c.SendStatus(401)
		}
		redmineUserId := user.Id
		settingJson, err := database.GetUserSetting(redmineUserId, c.Params("name"))
		if err != nil {
			c.Response().SetBodyString(err.Error())
			return c.SendStatus(500)
		}
		return c.JSON(settingJson)
	})

	app.Get("/api/setting/:name/value/:value", func(c *fiber.Ctx) error {
		user, err := getUser(c, store)
		if err != nil {
			log.Error(err)
			return c.SendStatus(401)
		}
		redmineUserId := user.Id //should be replaced by the user id
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
