# Deployment and production notes

To obtain a new certificate use certbot:

```shell
certbot --nginx -d urdr-test.nbis.se
```

Add a cronjob for root to automatically renew certs:

```shell
0 */12 * * * root /usr/bin/certbot renew > /dev/null 2>&1
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
