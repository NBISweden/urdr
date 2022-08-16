# Urdr - Setting up a test machine on SNIC SSC using pre-built images

## Create a VM on SNIC SSC
Create a VM on Snic (https://cloud.snic.se) using (https://github.com/NBISweden/os-pulumi), after installing Pulumi from (https://www.pulumi.com/).

To use os-pulumi, you need to have an account on cloud.snic.se and have generated/setup an api account password. Then you can, from your profile menu, save a file "Openstack RC File v3" for "OS Credentials" to source when running pulumi. (See README.md for os-pulumi.) When running Pulumi commands, you do not need to set another password inside pulumi if you do not want to.

You also need a public SSH key to be able to login to a snic VM created with os-pulumi. The main.go script creates a minimum-size machine with ports 22 and 443 opened.

## Pre-built Urdr containers

A snic VM is not capable of building a docker container for Urdr in a reasonable amount of time, so containers must be pre-built and pulled to the VM.

This means that especially the urdr-web container for the frontend must be built with variables PUBLIC_API_URL and PUBLIC_REDMINE_URL set to point to a url or an address where the Urdr backend and Redmine site can be located. If both of these are to be hosted on the snic VM, setup two separate DNS names for the IP address to the VM so that calls can be proxied based on the DNS name.

Suggestions for DNS names: urdr-test.nbis.se and urdr-test-redmine.nbis.se

Build like this from the urdr repo, path usually urdr/production/, setting TAG to the production container version to re-build for test:

```command
    $ cat > urdr.env <<END
    PUBLIC_API_URL="https://urdr-test.nbis.se"
    PUBLIC_REDMINE_URL="https://urdr-test-redmine.nbis.se"
    END
    $ TAG="1.0.4" docker-compose --env-file urdr.env build nginx 
```

Connect to the VM using:
    $ ssh -A -l ubuntu <ip-address/DNS>

## Preparing the VM

To prepare the machine, run the following from a command line:

```command
sudo apt update
sudo apt upgrade
sudo snap install docker
sudo addgroup --system docker
sudo adduser $USER docker
newgrp docker
sudo snap disable docker
sudo snap enable docker
sudo apt install python3-pip
pip3 install docker-compose
sudo groupadd urdr
sudo useradd -u 1001 -g 1001 -m urdr
```

## Setup RedMine

To be able to run Redmine, you must get a db dump and copy it to the VM to /home/ubuntu/redmine_db.dump using the following on your local machine:

```command
scp -i ~/.ssh/id_rsa.pub <local file> ubuntu@<ip addr>:/home/ubuntu/redmine_db.dump
```

If your account is not in the dump, you must add it manually into the postgres db after starting the postgres container.

Then run the following:

```command
git clone git@github.com:NBISweden/ops-redmine.git
cd ops-redmine/
./setup.sh
cp secrets.yml.example secrets.yml
cp configuration.yml.example configuration.yml
cp .postgres.env.default .postgres.env
cp .redmine.env.default .redmine.env
mv ../redmine_db.dump ./initdb.d/
```

Update docker-compose.override.yml for redmine to listen on all interfaces (0.0.0.0).
Bring up the postgres server and redmine with:

```command
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

## Setup Urdr

To get Urdr up and running, do the following (though replace docker image version tags to current ones):

```command
cd
git clone git@github.com:NBISweden/urdr.git
cd urdr/production/
cat > docker-compose.yml <<END
---
version: "3"
services:
  urdr:
    user: urdr
    image: ghcr.io/nbisweden/urdr:1.0.4
    container_name: urdr
    volumes:
      - ../backend/:/app
    expose:
      - "8080"
    ports:
      - 8080:8080
    restart: always
    env_file:
      - ./urdr.env
  nginx:
    image: harbor.nbis.se/test/urdr-web:1.0.4-tenv
    container_name: urdr-web
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - 4567:80
volumes:
  exclude: null
END

sudo chown -R urdr:urdr ../backend/
cp ../urdr.env.default urdr.env
```

Then update urdr.env so that REDMINE_URL points to http://172.17.0.1:3000. The file should look like this on Linux:

BACKEND_DB_PATH="./database.db"
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8080
REDMINE_URL="http://172.17.0.1:3000"
PUBLIC_REDMINE_URL="http://172.17.0.1:3000"
SESSION_DB_PATH="./session.db"
PUBLIC_API_URL="http://localhost:4567"

Start the urdr containers with:

```command
docker-compose -f docker-compose.yml up -d
```

## Setup nginx proxy and SSL certificates
To proxy calls and be able to use SSL/HTTPS, we need to install nginx and certbot:

```command
sudo apt install nginx
sudo apt install certbot
sudo apt install python3-certbot-nginx
```

Now open port 80 in the snic cloud web interface so acme challenge passes. (Project - Network - Security Groups, click "Manage Rules" for your security group. Its name is found in main.go for os-pulumi.)

Then create certificates with:

```command
sudo certbot -n -d urdr-test.nbis.se -d urdr-test-redmine.nbis.se --nginx --agree-tos --email your.address@nbis.se
```

Fix the /etc/nginx/nginx.conf to proxy calls to the machine to the correct container (presuming you set up DNS names as suggested above):

```command
sudo cat > /etc/nginx/nginx.conf >> END
events {
    worker_connections 768;
    # multi_accept on;
}
http {
map $host $host_upstream_mapped {
        default http://127.0.0.1:4567;

        urdr-test-redmine.nbis.se http://127.0.0.1:3000;
        urdr-test.nbis.se http://127.0.0.1:4567;
}

server {
     root /var/www/html;
     index index.html index.htm index.nginx-debian.html;
     server_name urdr-test.nbis.se urdr-test-redmine.nbis.se; # managed by Certbot

     location / {
          proxy_set_header Host $http_host;
         proxy_set_header X-Real-IP $remote_addr;
         proxy_pass $host_upstream_mapped$request_uri;
         proxy_redirect $host_upstream_mapped https://$host/;
    }

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/urdr-test.nbis.se/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/urdr-test.nbis.se/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}


server {
    if ($host = urdr-test.nbis.se) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    if ($host = urdr-test-redmine.nbis.se) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80 ;
    listen [::]:80 ;

    server_name urdr-test.nbis.se urdr-test-redmine.nbis.se;
    return 404; # managed by Certbot
}
}
END
```

Test the configuration file syntax and restart nginx if it was ok:

```command
sudo nginx -t -c /etc/nginx/nginx.conf
sudo systemctl restart nginx
```

Close port 80 again, using the Snic web interface.

Redmine should now be available via (https://urdr-test-redmine.nbis.se/) and Urdr via (https://urdr-test.nbis.se/).
