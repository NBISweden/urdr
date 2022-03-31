package api

import (
	"fmt"
	"urdr-api/internal/config"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
)

// getIssuesHandler godoc
// @Summary	Proxy for the "/issues.json" Redmine endpoint
// @Accept	json
// @Produce	json
// @Failure	401	{string}	error "Unauthorized"
// @Failure	500	{string}	error "Internal Server Error"
// @Router /api/issues [get]
func getIssuesHandler(c *fiber.Ctx) error {
	if ok, err := prepareRedmineRequest(c); !ok {
		return err
	}

	redmineURL := fmt.Sprintf("%s/issues.json?%s",
		config.Config.Redmine.URL, c.Request().URI().QueryString())

	return proxy.Do(c, redmineURL)
}
