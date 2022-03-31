package api

type user struct {
	Login string `json:"login"`
}

type Issue struct {
	Id      int    `json:"id"`
	Subject string `json:"subject"`
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
