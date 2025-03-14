FROM golang:1.24.1-alpine3.21

ENV XDG_CACHE_HOME='/tmp/.cache'
ENV CC='/usr/lib/ccache/bin/clang'

WORKDIR /app

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

RUN apk --no-cache add \
    curl=~8 \
    clang=~19 \
    clang-ccache=~19 \
    musl-dev=~1.2 \
    ccache=~4.10

RUN go install github.com/air-verse/air@v1.61.7

CMD ["air"]
