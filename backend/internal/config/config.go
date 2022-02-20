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
	Host   string
	Port   string
	ApiKey string
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

// LoadConfig populates ConfigMap with data
func LoadConfig(c *ConfigMap) error {
	// Load settings from .env
	err := godotenv.Load(getEnv("DOT_ENV_FILE", ".env"))
	if err != nil {
		return fmt.Errorf("godotenv.Load() failed: %w", err)
	}

	// Populate config structs, place defaults if empty in .env

	c.App.Host = getEnv("APP_HOST", "127.0.0.1")
	c.App.Port = getEnv("APP_PORT", "8080")

	c.Redmine.Host = getEnv("REDMINE_HOST", "redmine")
	c.Redmine.Port = getEnv("REDMINE_PORT", "3000")
	c.Redmine.ApiKey = getEnv("REDMINE_ADMIN_TOKEN", "")

	c.Database.Path = getEnv("URDR_DB_PATH", "./database.db")

	return nil
}
