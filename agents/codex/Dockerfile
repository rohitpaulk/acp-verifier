FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g @zed-industries/codex-acp@0.15.0

ENTRYPOINT ["codex-acp"]
