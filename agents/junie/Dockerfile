FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g @jetbrains/junie-cli@1468.30.0

ENTRYPOINT ["junie", "--acp", "true"]
