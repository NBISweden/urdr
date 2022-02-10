FROM golang:1.16.2-alpine3.13 as builder

ENV GOPATH=$PWD
ENV CGO_ENABLED=0

COPY . .

RUN go build -o ./urdr ./cmd
RUN echo "nobody:x:65534:65534:nobody:/:/sbin/nologin" > passwd

FROM scratch

COPY --from=builder /go/passwd /etc/passwd
COPY --from=builder /go/urdr* /usr/bin/
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

USER 65534
