FROM debian:bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates curl git ripgrep \
  && rm -rf /var/lib/apt/lists/*

RUN curl https://cursor.com/install -fsS | bash

ENV PATH="/root/.local/bin:${PATH}"

ENTRYPOINT ["cursor-agent", "--trust", "acp"]
