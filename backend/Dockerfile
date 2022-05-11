FROM golang:1.17.10-stretch

ENV XDG_CACHE_HOME='/tmp/.cache'

WORKDIR /app

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN apt-get update; \
    apt-get upgrade -y; \
    apt-get install --no-install-recommends -y git='1:2.*'; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*; \
    curl --fail --location \
    'https://raw.githubusercontent.com/cosmtrek/air/v1.29.0/install.sh' | \
    sh -e -s v1.29.0 && cp -v ./bin/air /bin/air

CMD ["air"]
