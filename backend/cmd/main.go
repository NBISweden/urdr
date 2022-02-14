package main

import (
	"urdr-api/api"
	"urdr-api/internal/config"
	"urdr-api/internal/logging"

	log "github.com/sirupsen/logrus"
)

// init is run before main, it loads the configuration variables
func init() {
	c := &config.Config
	config.LoadConfig(c)
	logging.LoggingSetup("debug")
}

func main() {
	// app contains the web app and endpoints

	log.Infof("Redmine host config: %s", config.Config.Redmine.Host)
	app := api.Setup(config.Config.Redmine)

	// Start server
	log.Fatal(app.Listen(config.Config.App.Host + ":" + config.Config.App.Port))

}
