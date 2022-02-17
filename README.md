# urdr: time logging made easy

## Miro board

https://miro.com/app/board/uXjVOVRByuw=/

## Team project in Figma

https://www.figma.com/file/Bf2OgUIIqRBMUREMuVcxs9/draft?node-id=0%3A1

## Setup

As a prerequisite, you need to clone the [ops-redmine repo](https://github.com/NBISweden/ops-redmine), and follow the instructions to setup and run redmine. These steps include importing a backup of redmine in your database. The backup file should be named `redmine_db.dump`.

Log in to the postgres container and then make your user administrator. Run the following commands, where `MYUSER` should be replaced with your redmine username:

```command
docker exec -it <postgres-container> bash
psql -U redmine
redmine=> update users set admin='t' where login='MYUSER';
```

Now please create the env file .env using .env.default as a template. If you are on Linux you need to set the variable `REDMINE_HOST="http://172.17.0.1"`. Then, fetch the API key of your redmine user by navigating to your page, and update urdr.env by setting the variable `REDMINE_ADMIN_TOKEN`.

Finally, you can start urdr by using:

```command
docker-compose build
docker-compose up
```

## Frontend

[node server](http://localhost:4242)

## Backend

[urdr api](http://localhost:8080/issues)

---

[![GitHub Super-Linter](https://github.com/NBISweden/urdr/workflows/Lint%20Code%20Base/badge.svg)](https://github.com/marketplace/actions/super-linter)
