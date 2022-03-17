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

	if err := config.Setup(); err != nil {
		log.Fatalf("config.LoadConfig() failed: %v", err)
	}

	if err := db.Setup(); err != nil {
		log.Fatalf("db.Setup() failed: %v", err)
	}
}

func main() {
	log.Infof("Redmine host config: %v", config.Config.Redmine.Host)

	// Start server
	log.Fatal(api.Setup().Listen(config.Config.App.Host + ":" + config.Config.App.Port))
}
