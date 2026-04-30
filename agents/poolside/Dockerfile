FROM debian:bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

RUN POOL_INSTALL_ACCEPT_EULA=1 \
  POOL_INSTALL_DIR=/usr/local/bin \
  POOL_INSTALL_UPDATE_PATH=0 \
  POOL_INSTALL_SPLASH=0 \
  sh -c "$(curl -fsSL https://downloads.poolside.ai/pool/install.sh)" v1.0.0

COPY entrypoint.sh /usr/local/bin/acp-verifier-poolside-entrypoint
RUN chmod +x /usr/local/bin/acp-verifier-poolside-entrypoint

ENTRYPOINT ["acp-verifier-poolside-entrypoint"]
