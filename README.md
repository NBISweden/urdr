# Urdr: Time logging made easy

## Miro board

[Miro board](https://miro.com/app/board/uXjVOVRByuw=/)

## Team project in Figma

[Figma project](https://www.figma.com/file/Bf2OgUIIqRBMUREMuVcxs9/draft?node-id=0%3A1)

## Setup

As a prerequisite, you need to clone the
[ops-redmine repository](https://github.com/NBISweden/ops-redmine), and
follow the instructions to setup and run Redmine. These steps include
importing a backup of Redmine in your database. The backup file should
be named `redmine_db.dump`.

Log in to the `postgres` container and then make your user
administrator. Run the following commands, where `MYUSER` should be
replaced with your Redmine username:

```command
docker exec -it <postgres-container> bash
psql -U redmine
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
