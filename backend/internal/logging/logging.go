package logging

import (
	log "github.com/sirupsen/logrus"
)

// Setup configures logging format and rules
func Setup(logLevel log.Level) {
	// Log formatting
	log.SetFormatter(&log.TextFormatter{
		DisableColors: true,
		FullTimestamp: true,
	})

	log.Info(logLevel)
	// Minimum message level
	log.SetLevel(logLevel)
}
