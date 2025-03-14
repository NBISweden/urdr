FROM golang:1.24.1-alpine3.21 AS builder

RUN addgroup -S urdr && getent group urdr >/tmp/group
RUN adduser -S urdr && getent passwd urdr >/tmp/passwd

WORKDIR /go

COPY ./ .

RUN apk --no-cache add \
    clang=~19 \
    musl-dev=~1.2

ENV GOPATH=$PWD
ENV CGO_ENABLED=1
ENV CC=clang
RUN go build -ldflags "-linkmode external -extldflags -static" -o ./urdr ./cmd

FROM scratch

WORKDIR /app

COPY --from=builder /tmp/group /tmp/passwd /etc/
COPY --from=builder /go/urdr* /usr/bin/
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt


CMD [ "urdr" ]
