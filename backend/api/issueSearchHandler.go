package api

import (
	"encoding/json"
	"fmt"
	"urdr-api/internal/config"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
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
			Id      int     `json:"id"`
			Type    string  `json:"type"`
			Title   string  `json:"title"`
			Project Project `json:"project"`
		} `json:"results"`
	}{}

	if err := json.Unmarshal(c.Response().Body(), &searchResponse); err != nil {
		c.Response().Reset()
		return c.SendStatus(fiber.StatusUnprocessableEntity)
	}

	var foundIssues []Issue

	for _, issue := range searchResponse.Results {
		if issue.Type == "issue" {

			c.Request().URI().SetQueryString(
				fmt.Sprintf("issue_id=%d", issue.Id))

			if err := getIssuesHandler(c); err != nil {
			} else if c.Response().StatusCode() != fiber.StatusOK {
				return nil
			}

			// Parse the response and fill out the subjects.
			issuesResponse := struct {
				Issues []Issue `json:"issues"`
			}{}

			if err := json.Unmarshal(c.Response().Body(), &issuesResponse); err != nil {
				c.Response().Reset()
				return c.SendStatus(fiber.StatusUnprocessableEntity)
			}

			issue := Issue{
				Id:      issue.Id,
				Subject: issuesResponse.Issues[0].Subject,
				Project: issuesResponse.Issues[0].Project,
			}
			foundIssues = append(foundIssues, issue)
		}
	}

	return c.JSON(IssuesResponse{
		Issues: foundIssues,
	})
}
