package api

type Project struct {
	Id int `json:"id"`
}

type Issue struct {
	Id      int     `json:"id"`
	Subject string  `json:"subject"`
	Project Project `json:"project"`
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
}

type PriorityEntry struct {
	Issue      Issue    `json:"issue"`
	Activity   Activity `json:"activity"`
	CustomName string   `json:"custom_name"`
	IsHidden   bool     `json:"is_hidden"`
}
