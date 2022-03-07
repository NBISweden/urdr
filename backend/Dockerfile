FROM golang:1.17.8-stretch

ENV XDG_CACHE_HOME='/tmp/.cache'

WORKDIR /app

RUN apt-get -y update; \
    apt-get -y upgrade; \
    apt-get -y install git; \
    curl --fail --location \
        'https://raw.githubusercontent.com/cosmtrek/air/master/install.sh' | \
    sh -e -s && cp -v ./bin/air /bin/air

CMD air
