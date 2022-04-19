# Deployment and production notes

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

To start the actual service do:

```shell
cd production
docker-compose up -d
```

To check logs:

```shell
docker-compose logs
cat /var/log/nginx/error.log
cat /var/log/nginx/access.log
```
