FROM golang:1.19-alpine3.16

ENV XDG_CACHE_HOME='/tmp/.cache'

WORKDIR /app

RUN apk -U upgrade; \
    apk add curl gcc musl-dev; \
    rm -rf /var/cache/apk/*; \
    curl --fail --location \
        'https://raw.githubusercontent.com/cosmtrek/air/v1.29.0/install.sh' | \
    sh -e -s v1.29.0 && cp -v ./bin/air /bin/air

CMD ["air"]
