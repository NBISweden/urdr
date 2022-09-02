FROM golang:1.19-alpine3.16 as builder

ENV GOPATH=$PWD

WORKDIR /go

COPY ./ .

RUN apk --no-cache add \
        'gcc=~11.2.1' \
        'musl-dev=~1.2.3'; \
    rm -rf /var/cache/apk/*

RUN go build -o ./urdr ./cmd && \
    echo "urdr:x:1001:1001:urdr:/:/sbin/nologin" > passwd

FROM alpine:3.16

WORKDIR /app

COPY --from=builder /go/passwd /etc/passwd
COPY --from=builder /go/urdr* /usr/bin/
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt


CMD [ "urdr" ]
