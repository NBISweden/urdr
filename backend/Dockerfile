FROM golang:1.17.7-alpine3.15 as builder

ENV GOPATH=$PWD
ENV CGO_ENABLED=0 GOOS=linux

COPY . .

RUN go build -o ./urdr ./cmd
RUN echo "nobody:x:65534:65534:nobody:/:/sbin/nologin" > passwd

FROM scratch

COPY --from=builder /go/passwd /etc/passwd
COPY --from=builder /go/urdr* /usr/bin/
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

USER 65534
