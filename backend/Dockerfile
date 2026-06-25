FROM golang:1.26-alpine

ENV XDG_CACHE_HOME='/tmp/.cache'
ENV CC='/usr/lib/ccache/bin/clang-21'

WORKDIR /app

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

# hadolint ignore=DL3018
RUN apk --no-cache add \
    curl=~8 \
    clang21 \
    clang21-ccache \
    binutils=~2 \
    gcc=~15 \
    musl-dev=~1.2 \
    ccache=~4

RUN CGO_ENABLED=0 go install github.com/air-verse/air@v1.65.1

CMD ["air"]
