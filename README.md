# Urdr: Time logging made easy

## Miro board

[Miro board](https://miro.com/app/board/uXjVOVRByuw=/)

## Team project in Figma

[Figma project](https://www.figma.com/file/Bf2OgUIIqRBMUREMuVcxs9/draft?node-id=0%3A1)

## Development setup

### Local Redmine setup

As a prerequisite for running Urdr during development, you need to run
a local installation of Redmine.  The NBIS Redmine installation is
currently maintained in the
[ops-redmine repository](https://github.com/NBISweden/ops-redmine).

Follow
[the instructions](https://github.com/NBISweden/ops-redmine/blob/main/README.md)
to set up and run Redmine locally.  The repository may be cloned in a
separate directory, away from where you cloned the `urdr` repository.

The setup of Redmine includes importing a database dump of Redmine
in your local Redmine database.  The database dump file should be
named `redmine_db.dump`, and it should be placed in that repository's
`initdb.d` directory.

When the local Redmine containers are up and running, log in to the
`postgres` container and turn your user into a Redmine administrator.
Run the following commands from within the `ops-redmine` repository.
Replace `MYUSER` with your Redmine username:

```command
docker-compose -f docker-compose-dev.yml exec -- postgres psql -U redmine
redmine=> update users set admin='t' where login='MYUSER';
```

=======
### Urdr setup

1. In the `backend` directory of the `urdr` repository, create the
file `.env`, using `.env.default` as the template.  If you are on
Linux, you need to set the variable `REDMINE_HOST` to the value
`"http://172.17.0.1"`.

2. Create a database for the Urdr backend containing the Urdr schema and
default values.  From the top directory in the `urdr` repository.

   ```shell
   rm -f backend/database.db
   sqlite3 backend/database.db <sql/schema.sql
   sqlite3 backend/database.db <sql/setting-defaults.sql
   ```

   The name and location of the database file is configurable by setting
   `URDR_DB_PATH` in the `.env` file.  The value of that variable is a
   pathname relative to the `backend` directory, and the default value
   is `./database.db`.

Finally, you can start Urdr by using:

```command
docker-compose build
docker-compose up
```

## Frontend dev server

In order to install/update packages in the node-urdr server you should:

- Make the neccessary updates in the package.json
- Execute the following commands:

```command
docker-compose down node-urdr --volumes
docker-compose build node-urdr
docker-compose up node-urdr
```

## Frontend

[Node.js server](http://localhost:4242)

## Backend

[Urdr API](http://localhost:8080/issues)

---

[![GitHub Super-Linter](https://github.com/NBISweden/urdr/workflows/Lint%20Code%20Base/badge.svg)](https://github.com/marketplace/actions/super-linter)
