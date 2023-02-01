FROM golang:1.19-alpine

ENV XDG_CACHE_HOME='/tmp/.cache'

WORKDIR /app

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

RUN apk --no-cache add \
        'curl=~7.83.1' \
        'gcc=~11.2.1' \
        'musl-dev=~1.2.3'; \
    rm -rf /var/cache/apk/*; \
    curl --silent --fail --location \
        'https://raw.githubusercontent.com/cosmtrek/air/v1.40.4/install.sh' | \
    sh -e -s v1.40.4 && cp -v ./bin/air /bin/air

CMD ["air"]
