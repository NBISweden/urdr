# urdr: time logging made easy

## Miro board

https://miro.com/app/board/uXjVOVRByuw=/

## Team project in Figma

https://www.figma.com/file/Bf2OgUIIqRBMUREMuVcxs9/draft?node-id=0%3A1

## Setup

As a prerequisite, you need to clone the [ops-redmine repo](https://github.com/NBISweden/ops-redmine) and follow the instructions until you run ./setup.sh. These steps include importing a backup of redmine in your database.

Start by creating a network and spinning up Redmine:

```command
docker network create urdr-net
cp docker-compose-dev.yml ops-redmine/
cd ops-redmine
docker-compose -f docker-compose-dev.yml up
```

Log in to the postgres container and then make your user administrator:

```command
docker exec -it <postgres-container> bash
psql -U redmine
redmine=> update users set admin='t' where login='MYUSER';
```

Now you need to fetch the API key of your user by navigating to your page, and add it to urdr.env by setting the variable `REDMINE_ADMIN_TOKEN`.

Finally, start the `urdr` and `node` services by using:

```command
cd ../
docker-compose -f docker-compose.yml up urdr node-urdr
```

## Frontend

[node server](http://localhost:4242)

## Backend

[urdr api](http://localhost:8080/issues)
