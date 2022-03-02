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

1. In the top-most directory of the `urdr` repository, create the file
   `urdr.env`, using `urdr.env.default` as the template. If you are
   on Linux, you need to set the variable `REDMINE_HOST` to the value
   `"http://172.17.0.1"`.

2. Create a database for the Urdr backend containing the Urdr schema and
   default values. From the top directory in the `urdr` repository.

   ```shell
   rm -f backend/database.db
   sqlite3 backend/database.db <backend/sql/schema.sql
   sqlite3 backend/database.db <backend/sql/setting-defaults.sql
   ```

   The name and location of the database file is configurable by setting
   `BACKEND_DB_PATH` in the `urdr.env` file. The value of that variable
   is a pathname relative to the `backend` directory, and the default
   value is `./database.db`.

Finally, you can start Urdr by using:

```command
docker-compose build
docker-compose up
```

## API specification

In order to rebuild the API spec you should run:

```command
# For installing swag, follow https://github.com/swaggo/swag
swag init -g cmd/main.go
```

[Swagger](http://localhost:8080/swagger/index.html)

## Frontend dev server

In order to run the node-urdr server in a Docker container, you don't need to install frontend packages locally. However, for your IDE (e.g. VSCode) to deal properly with React and other packages, a local install might be needed. To do that:

- Move to the `/frontend` directory
- Run `npm ci`.

### Installing and updating packages

In order to minimize dependency errors after installing or updating packages, your local machine should have the same versions of Node and npm installed as used in the Docker container:

- Node version 17.6.0
- npm version 8.5.1

To install/update packages in the node-urdr server you should:

- Make the neccessary updates in `package.json`
- Run `npm install` locally to generate a new `package-lock.json`
- Execute the following commands:

```command
docker-compose down node-urdr --volumes
docker-compose build node-urdr
docker-compose up node-urdr
```

Finally, you should commit and push your changes in both `package.json` and `package-lock.json` to GitHub. During build, the Docker container does not generate a new `package-lock.json` file for installing packages but rather uses the one found in the repo.

## Frontend

[Node.js server](http://localhost:4242)

## Backend

[Urdr API](http://localhost:8080/issues)

---

[![GitHub Super-Linter](https://github.com/NBISweden/urdr/workflows/Lint%20Code%20Base/badge.svg)](https://github.com/marketplace/actions/super-linter)
