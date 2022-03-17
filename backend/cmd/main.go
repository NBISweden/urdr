package main

import (
	"urdr-api/api"
	"urdr-api/internal/config"
	db "urdr-api/internal/database"
	"urdr-api/internal/logging"

	log "github.com/sirupsen/logrus"
)

// init is run before main.  It loads the configuration variables and
// connects to the database.
func init() {
	logging.Setup(log.DebugLevel)

	err := config.Setup()
	if err != nil {
		log.Fatalf("config.LoadConfig() failed: %v", err)
	}

	err = db.Setup()
	if err != nil {
		log.Fatalf("db.Setup() failed: %v", err)
	}
}

func main() {
	// app contains the web app and endpoints

	log.Infof("Redmine host config: %s", config.Config.Redmine.Host)
	app := api.Setup()

	// Start server
	log.Fatal(app.Listen(config.Config.App.Host + ":" + config.Config.App.Port))
}
