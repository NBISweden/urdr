# Deployment and production notes

## Certificates

To renew certificates manually use:

```shell
    certbot renew -n --quiet
```

If the certificates do not exist then run:

```shell
    certbot certonly -n \
    -d urdr-test.nbis.se \
    -d urdr-test-redmine.nbis.se \
    --nginx \
    --agree-tos
```

## Service user

Before starting the service, you need to create the following user:

```shell
/usr/sbin/useradd -u 1001 -g 1001 -m urdr
```

## Build and deployment

To build the needed images do:

```shell
cd production
TAG=latest docker-compose --env-file urdr.env build --no-cache
```

To start the actual services do:

```shell
TAG=latest docker-compose up -d
```

To check logs:

```shell
docker-compose logs
cat /var/log/nginx/error.log
cat /var/log/nginx/access.log
```
