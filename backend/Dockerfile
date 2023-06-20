FROM golang:1.20-alpine

ENV XDG_CACHE_HOME='/tmp/.cache'

WORKDIR /app

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

RUN apk --no-cache add \
    'curl=~8' \
    'gcc=~12' \
    'musl-dev=~1.2'; \
    curl --silent --fail --location \
    'https://raw.githubusercontent.com/cosmtrek/air/v1.44.0/install.sh' | \
    sh -e -s v1.40.4 && cp -v ./bin/air /bin/air

CMD ["air"]
