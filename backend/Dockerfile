FROM golang:1.26-alpine

ENV XDG_CACHE_HOME='/tmp/.cache'
ENV CC='/usr/lib/ccache/bin/clang'

WORKDIR /app

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

# hadolint ignore=DL3018
RUN apk --no-cache add \
    curl=~8 \
    clang \
    clang-ccache \
    musl-dev=~1.2 \
    ccache=~4

RUN go install github.com/air-verse/air@v1.61.7

CMD ["air"]
