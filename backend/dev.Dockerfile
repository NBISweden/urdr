FROM golang:1.17.8-stretch

ENV ENV CGO_ENABLED=0 XDG_CACHE_HOME='/tmp/.cache'

RUN apt update && apt upgrade -y && \
    apt install -y git \
    make openssh-client

RUN curl -fLo install.sh https://raw.githubusercontent.com/cosmtrek/air/master/install.sh \
    && chmod +x install.sh && sh install.sh && cp ./bin/air /bin/air

WORKDIR /app

CMD air
