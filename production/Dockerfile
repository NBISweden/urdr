FROM golang:1.18.5-alpine3.15 as builder

ENV GOPATH=$PWD

WORKDIR /go

COPY ./ .

RUN apk --update add gcc=10.3.1_git20211027-r0 \
    musl-dev=1.2.2-r7 --no-cache && \
    rm -rf /var/cache/apk/*

RUN go build -o ./urdr ./cmd && \
    echo "urdr:x:1001:1001:urdr:/:/sbin/nologin" > passwd

FROM alpine:3.16.2

WORKDIR /app

COPY --from=builder /go/passwd /etc/passwd
COPY --from=builder /go/urdr* /usr/bin/
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt


CMD [ "urdr" ]
