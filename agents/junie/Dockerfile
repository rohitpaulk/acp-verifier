FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends libssl3 ca-certificates curl unzip && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://junie.jetbrains.com/install.sh | JUNIE_VERSION=1668.54 bash \
  && ln -s /root/.local/bin/junie /usr/local/bin/junie

ENTRYPOINT ["junie", "--acp", "true"]
