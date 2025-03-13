# Urdr: Time logging made easy

## Miro board

[Miro board](https://miro.com/app/board/uXjVOVRByuw=/)

## Team project in Figma

[Figma project](https://www.figma.com/file/Bf2OgUIIqRBMUREMuVcxs9/draft?node-id=0%3A1)

## Development setup

### Local Redmine setup

As a prerequisite for running Urdr during development, you need to run
a local installation of Redmine. The NBIS Redmine installation is
currently maintained in the
[ops-redmine repository](https://github.com/NBISweden/ops-redmine).

Follow
[the instructions](https://github.com/NBISweden/ops-redmine/blob/main/README.md)
to set up and run Redmine locally. The repository may be cloned in a
separate directory, away from where you cloned the `urdr` repository.

The setup of Redmine includes importing a database dump of Redmine
in your local Redmine database. The database dump file should be
named `redmine_db.dump`, and it should be placed in that repository's
`initdb.d` directory.

### Urdr setup

In the top-most directory of the `urdr` repository, create the
file `urdr.env`, using `urdr.env.default` as the template. If you
are on Linux, you need to set the variables `REDMINE_URL` and
`PUBLIC_REDMINE_URL` to the
value `"http://172.17.0.1:3000"`. The `PUBLIC_API_URL`
variable should be set to the URL from which the service is publicly
accessible, e.g. `"http://localhost:4567"` during development.

The database used by the Urdr backend containing the Urdr schema and
default values is created automatically when it is first accessed by
the backend Go code. If this database, for whatever reason, needs to
be manually be re-created, you may do so using the following set of
commands:

```shell
rm -f backend/database.db
sqlite3 backend/database.db <backend/sql/schema.sql
sqlite3 backend/database.db <backend/sql/setting-defaults.sql
```

The database must also contain information about invalid issue+activity
pairs, as well as information about Redmine groups and users.  In
production, this is information that is updated on a regular basis
by running the two update script in `backend/sql`.  On a development
system, these scripts may be invoked like so:

```shell
./backend/sql/update-invalid_entry.sh "$REDMINE_REPO"/docker-compose.yml backend/database.db
./backend/sql/update-groups.sh        "$REDMINE_REPO"/docker-compose.yml backend/database.db
```

... where `"$REDMINE_REPO"` is some path to the cloned `ops-redmine`
repository.  Note that the Redmine `postgres` container is assumed to be
running when these scripts are called.

The name and location of the database file are configurable by setting
`BACKEND_DB_PATH` in the `urdr.env` file. The value of that variable is
a pathname relative to the `backend` directory, and the default value is
`./database.db`.

Finally, you can start Urdr by using:

```command
docker-compose build
docker-compose up
```

## Database migrations

The Urdr service has a local database.  The schema of this database is
defined in `backend/sql/schema.sql`.  If the schema is updated, the
database must be migrated to the new schema (unless the database instead
is recreated from scratch).  This is done by running the `migrate.sh`
script in the `backend/sql` directory.

```command
backend/sql/migrate.sh backend/database.db
```

## Tests

There are tests for each part of the backend API, which can be tested by the following command:

```command
go test -v ./...
```

## API specification

In order to rebuild the API spec you should run:

```command
# For installing swag, follow https://github.com/swaggo/swag
swag init -g api/api.go
```

[Swagger](http://localhost:8080/swagger/index.html)

## Frontend dev server

In order to run the node-urdr server in a Docker container, you don't need to install frontend packages locally. However, for your IDE (e.g. VSCode) to deal properly with React and other packages, a local install might be needed. To do that:

- Move to the `/frontend` directory
- Run `npm ci`.

### Installing and updating packages

In order to avoid dependency differences between local environments we create our `package-lock.json` file in a separate Docker container.

If you want to add a new dependency to the project:

- add it in the `package.json` file using semantic versioning. We usually specify versions using the Caret (^) to automatically include minor releases, for example

```json
"typescript": "^4.5.5"
```

- move to the `frontend` folder and run `./update-package-lock`. A new `package-lock.json` file will be created.
- add, commit and push `package.json` and `package-lock.json` to GitHub.

Have in mind that these steps will also update existing dependencies according to the rules specified in `package.json`.

Afterwards, you will have to rebuild the Docker container that runs the Node.js server. Do like this:

```command
docker-compose down node-urdr --volumes
docker-compose build node-urdr
docker-compose up node-urdr
```

If you only want to update dependencies, follow the same steps but skip adding a new dependency.

## Frontend

[Nginx server](http://localhost:4567)

## Backend

[Urdr API](http://localhost:8080/issues)

---

[![GitHub Super-Linter](https://github.com/NBISweden/urdr/workflows/Lint%20Code%20Base/badge.svg)](https://github.com/marketplace/actions/super-linter)
