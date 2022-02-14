package config

import (
	"os"

	"github.com/joho/godotenv"
	log "github.com/sirupsen/logrus"
)

// Config is a global configuration value store
var Config ConfigMap

// ConfigMap stores all different configs
type ConfigMap struct {
	App     AppConfig
	Redmine RedmineConfig
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

// GetEnv returns given os.Getenv value, or a default value if os.Getenv is empty
func GetEnv(key string, def string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return def
}

// LoadConfig populates ConfigMap with data
func LoadConfig(c *ConfigMap) {
	// Load settings from .env
	err := godotenv.Load(GetEnv("DOT_ENV_FILE", ".env"))
	if err != nil {
		log.Errorf("failed to load environment variables from .env, %s", err)
	}
	// Populate config structs, place defaults if empty in .env
	c.App.Host = GetEnv("APP_HOST", "127.0.0.1")
	c.App.Port = GetEnv("APP_PORT", "8080")
	c.Redmine.Host = GetEnv("REDMINE_HOST", "redmine")
	c.Redmine.Port = GetEnv("REDMINE_PORT", "3000")
	c.Redmine.ApiKey = GetEnv("REDMINE_ADMIN_TOKEN", "")
}
