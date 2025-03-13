FROM golang:1.23-alpine3.21

ENV XDG_CACHE_HOME='/tmp/.cache'

WORKDIR /app

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

RUN apk --no-cache add \
    curl=~8 \
    gcc=~14 \
    musl-dev=~1.2

RUN go install github.com/air-verse/air@v1.61.7

CMD ["air"]
