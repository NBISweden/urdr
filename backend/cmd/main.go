package main

import (
	"urdr-api/api"
	"urdr-api/internal/config"
	"urdr-api/internal/database"

	log "github.com/sirupsen/logrus"
)

// init is run before main.  It loads the configuration variables and
// connects to the database.
func init() {
	log.SetFormatter(&log.TextFormatter{
		DisableColors: true,
		FullTimestamp: true,
	})
	log.SetLevel(log.DebugLevel)

	if err := config.Setup(); err != nil {
		log.Fatalf("config.LoadConfig() failed: %v", err)
	}

	if err := database.Setup(); err != nil {
		log.Fatalf("db.Setup() failed: %v", err)
	}
}

func main() {
	log.Infof("Redmine host config: %v", config.Config.Redmine.URL)

	// Start server
	log.Fatal(api.Setup().Listen(config.Config.App.Host + ":" + config.Config.App.Port))
}
