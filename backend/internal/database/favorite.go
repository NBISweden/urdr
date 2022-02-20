package database

// A favorite is a combination of a Redmine issue ID and a Redmine
// activity ID.  These are two integers.  A favorite also has a name, a
// sort of textual label picked by the user.
type Favorite struct {
	Name string
	RedmineIssueId int
	RedmineActivityId int
}

// GetFavorites returns an array of favorites given a specific Redmine
// user ID.  The returned array is ordered in priority order.
func GetFavorites(redmineUserId int) []Favorite {}

func SetFavorites(redmineUserId int, favorites []Favorite)
