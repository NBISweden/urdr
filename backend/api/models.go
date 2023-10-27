package api

type user struct {
	Login string `json:"login"`
}

type Project struct {
	Id int `json:"id"`
}

type Issue struct {
	Id      int     `json:"id"`
	Subject string  `json:"subject"`
	Project Project `json:"project"`
}

type IssueWithTitle struct {
	Id    int    `json:"id"`
	Title string `json:"title"`
}

type IssuesResponse struct {
	Issues []Issue `json:"issues"`
}

type Activity struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type Entry struct {
	Issue    Issue    `json:"issue"`
	Activity Activity `json:"activity"`
	Project  Project  `json:"project"`
}

type PriorityEntry struct {
	Issue      Issue    `json:"issue"`
	Activity   Activity `json:"activity"`
	CustomName string   `json:"custom_name"`
	IsHidden   bool     `json:"is_hidden"`
}

type IssueSearchResponse struct {
	Results []IssueWithTitle `json:"results"`
}
