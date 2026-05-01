FROM debian:bookworm-slim

ARG DOCKER_AGENT_VERSION=1.54.0
ARG TARGETARCH

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

RUN case "${TARGETARCH}" in \
    amd64|arm64) asset_arch="${TARGETARCH}" ;; \
    *) echo "Unsupported architecture: ${TARGETARCH}" >&2; exit 1 ;; \
  esac \
  && curl -fsSL "https://github.com/docker/docker-agent/releases/download/v${DOCKER_AGENT_VERSION}/docker-agent-linux-${asset_arch}" -o /usr/local/bin/docker-agent \
  && chmod +x /usr/local/bin/docker-agent

COPY test-agent.yaml /opt/docker-agent/test-agent.yaml

ENV TELEMETRY_ENABLED=false
ENV CAGENT_HIDE_TELEMETRY_BANNER=1

ENTRYPOINT ["docker-agent", "serve", "acp", "/opt/docker-agent/test-agent.yaml"]
