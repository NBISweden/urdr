FROM golang:1.17.8-alpine3.15 as builder

ENV GOPATH=$PWD

COPY ./ .

RUN apk add gcc musl-dev

RUN go build -o ./urdr ./cmd && \
    echo "nobody:x:65534:65534:nobody:/:/sbin/nologin" > passwd

FROM alpine:3.15

WORKDIR /app

COPY --from=builder /go/passwd /etc/passwd
COPY --from=builder /go/urdr* /usr/bin/
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt


CMD [ "urdr" ]
