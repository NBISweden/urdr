package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
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
	Host string
	Port string
}

type RedmineConfig struct {
	Host string
	Port string
}

type DatabaseConfig struct {
	Path string
}

// getEnv returns given os.Getenv value, or a default value if os.Getenv is empty
func getEnv(key string, def string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return def
}

// Setup populates ConfigMap with data
func Setup() error {
	// Load settings from .env
	err := godotenv.Load(getEnv("DOT_ENV_FILE", "./urdr.env"))
	if err != nil {
		return fmt.Errorf("godotenv.Load() failed: %w", err)
	}

	// Populate config structs, place defaults if empty in .env

	Config.App.Host = getEnv("BACKEND_HOST", "127.0.0.1")
	Config.App.Port = getEnv("BACKEND_PORT", "8080")

	Config.Redmine.Host = getEnv("REDMINE_HOST", "redmine")
	Config.Redmine.Port = getEnv("REDMINE_PORT", "3000")

	Config.Database.Path = getEnv("BACKEND_DB_PATH", "./database.db")

	return nil
}
