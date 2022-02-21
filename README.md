# Urdr: Time logging made easy

## Miro board

[Miro board](https://miro.com/app/board/uXjVOVRByuw=/)

## Team project in Figma

[Figma project](https://www.figma.com/file/Bf2OgUIIqRBMUREMuVcxs9/draft?node-id=0%3A1)

## Development setup

### Local Redmine setup

As a prerequisite for running Urdr during development, you need to run
a local installation of Redmine.  Our Redmine installation is currently
maintained in the
[ops-redmine repository](https://github.com/NBISweden/ops-redmine).

Follow
[the instructions](https://github.com/NBISweden/ops-redmine/blob/main/README.md)
to setup and run Redmine.  The repository may be cloned in a separate
directory, away from where you cloned the `urdr` repository.

The setup of Redmine include importing a database dump of Redmine
in your local Redmine database. The database dump file should be
named `redmine_db.dump` and it should be placed in that repository's
`initdb.d` directory.

When the Redmine containers are up and running (use e.g. the
`docker-compose-dev.yml` file with `docker-compose` as described in
their `README.md`), log in to the `postgres` container and then make
your user administrator. Run the following commands, where `MYUSER`
should be replaced with your Redmine username:

```command
cd .../ops-redmine
docker-compose -f docker-compose-dev.yml exec -- postgres psql -U redmine
redmine=> update users set admin='t' where login='MYUSER';
```

Now please create the env file `.env` using `.env.default` as
a template. If you are on Linux you need to set the variable
`REDMINE_HOST="http://172.17.0.1"`.

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
