FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g @github/copilot

# Required at runtime:
#   COPILOT_GITHUB_TOKEN - Fine-grained PAT with "Copilot Requests" permission

ENTRYPOINT ["copilot", "--acp"]
