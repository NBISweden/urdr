package api

import (
	"encoding/json"
	"fmt"
	"urdr-api/internal/config"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
	log "github.com/sirupsen/logrus"
)

// loginHandler godoc
// @Summary	Search for open Redmine issues
// @Description	Search for issues passing using a search wuery
// @Accept	json
// @Produce	json
// @Success	200	{object}	[]redmine.Issue
// @Failure	422	{string}	error "Unprocessable Entity"
// @Failure	500	{string}	error "Internal Server Error"
// @Router /api/search [post]
func issueSearchHandler(c *fiber.Ctx) error {

	if ok, err := prepareRedmineRequest(c); !ok {
		return err
	}

	redmineURL := fmt.Sprintf("%s/search.json?%s",
		config.Config.Redmine.URL, c.Request().URI().QueryString())

	// Redmine wants a GET request here, not a POST.
	c.Request().Header.SetMethod(fiber.MethodGet)

	if err := proxy.Do(c, redmineURL); err != nil {
		return err
	}

	searchResponse := struct {
		Results []struct {
			Id    int    `json:"id"`
			Title string `json:"title"`
		} `json:"results"`
	}{}

	log.Debug(string(c.Response().Body()))

	if err := json.Unmarshal(c.Response().Body(), &searchResponse); err != nil {
		c.Response().Reset()
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	log.Debug("Search response: ", searchResponse)

	var foundIssues []Issue

	for _, issue := range searchResponse.Results {
		foundIssues = append(foundIssues, Issue{
			Id:      issue.Id,
			Subject: issue.Title,
		})
	}

	return c.JSON(IssuesResponse{
		Issues: foundIssues,
	})
}
