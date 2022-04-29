package config

import (
	"os"
)

// Config is a global configuration value store
var Config ConfigMap

// ConfigMap stores all different configs
type ConfigMap struct {
	App      AppConfig
	Redmine  RedmineConfig
	Database DatabaseConfig
}

type AppConfig struct {
	Host          string
	Port          string
	SessionDBPath string
}

type RedmineConfig struct {
	URL string
}

type DatabaseConfig struct {
	Path string
}

// getEnv() returns given environment variable's value, or a default
// value if the environment variable does not exist.
func getEnv(key string, defaultValue string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return defaultValue
}

// Setup populates ConfigMap with data
func Setup() error {
	// Populate config structs, and use defaults if the needed
	// variable is not in the environment.

	Config.App.Host = getEnv("BACKEND_HOST", "0.0.0.0")
	Config.App.Port = getEnv("BACKEND_PORT", "8080")
	Config.App.SessionDBPath = getEnv("SESSION_DB_PATH", "./session.db")

	Config.Redmine.URL = getEnv("SNOWPACK_PUBLIC_REDMINE_URL", "http://host.docker.internal:3000")

	Config.Database.Path = getEnv("BACKEND_DB_PATH", "./database.db")

	return nil
}
