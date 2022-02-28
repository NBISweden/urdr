package database

// The Favorite type is a simple struct that encapsulates a "favorite",
// i.e. a Redmine issue ID and a Redmine activity ID together with a
// custom name.  There is also an internal ID field corresponding to the
// favorite_id field in the database.
type Favorite struct {
	id                int
	RedmineIssueId    int
	RedmineActivityId int
	Name              string
}

func GetAllUserFavorites(redmineUserId int) ([]Favorite, error) {
	return nil, nil
}

func AddUserFavorite(redmineUserId int, favorite *Favorite) error {
	return nil
}

func DeleteUserFavorite(redmineUserId int, favorite *Favorite) error {
	return nil
}
