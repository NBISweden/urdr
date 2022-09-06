package redmine

type IdName struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type Issue struct {
	Id             int     `json:"id"`
	Subject        string  `json:"subject"`
	Description    string  `json:"description"`
	ProjectId      int     `json:"project_id"`
	Project        *IdName `json:"project"`
	StatusId       int     `json:"status_id"`
	Status         *IdName `json:"status"`
	Author         *IdName `json:"author"`
	AssignedTo     *IdName `json:"assigned_to"`
	AssignedToId   int     `json:"assigned_to_id"`
	Category       *IdName `json:"category"`
	CategoryId     int     `json:"category_id"`
	Notes          string  `json:"notes"`
	StatusDate     string  `json:"status_date"`
	CreatedOn      string  `json:"created_on"`
	UpdatedOn      string  `json:"updated_on"`
	StartDate      string  `json:"start_date"`
	DueDate        string  `json:"due_date"`
	ClosedOn       string  `json:"closed_on"`
	DoneRatio      float32 `json:"done_ratio"`
	EstimatedHours float32 `json:"estimated_hours"`
}

type IssuesResponse struct {
	Issues     []Issue `json:"issues"`
	TotalCount uint    `json:"total_count"`
	Offset     uint    `json:"offset"`
	Limit      uint    `json:"limit"`
}

type TimeEntry struct {
	Issue    int     `json:"id"`
	SpentOn  string  `json:"spent_on"`
	Hours    float32 `json:"hours"`
	Activity int     `json:"activity_id"`
	Comments string  `json:"comments"`
	User     int     `json:"user_id"`
}

type User struct {
	Id     int    `json:"id"`
	Login  string `json:"login"`
	ApiKey string `json:"api_key"`
}
type Account struct {
	User `json:"user"`
}

type TimeEntryResult struct {
	TimeEntry TimeEntry `json:"time_entry"`
}
type TimeEntriesResult struct {
	TimeEntries []TimeEntry `json:"time_entries"`
}

type TimeEntryActivitiesResult struct {
	TimeEntryActivities []TimeEntryActivity `json:"time_entry_activities"`
}

type TimeEntryActivity struct {
	Id        int    `json:"id"`
	Name      string `json:"name"`
	IsDefault bool   `json:"is_default"`
}

type Group struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}
