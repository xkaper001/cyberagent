FROM python:3.11-slim

WORKDIR /app

# Install all required core tools + package management utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    nmap \
    bind9-dnsutils \
    dnsutils \
    curl \
    netcat-openbsd \
    iputils-ping \
    debianutils \
    ca-certificates \
    procps \
    apt-utils \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Build-time mandatory verification step for the 7 required core tools
RUN which dig && which nmap && which nslookup && which ping && which which && which curl && which nc

# Create unprivileged worker user & configure sudo for controlled package installation
RUN useradd -m -u 10001 worker && \
    mkdir -p /workspace && \
    chown -R worker:worker /workspace /app && \
    echo "worker ALL=(root) NOPASSWD: /usr/bin/apt-get, /usr/bin/apt" > /etc/sudoers.d/worker-apt && \
    chmod 0440 /etc/sudoers.d/worker-apt

COPY --chown=worker:worker parsers/ /app/parsers/
COPY --chown=worker:worker config/ /app/config/
COPY --chown=worker:worker entrypoint.py /app/entrypoint.py

RUN chmod +x /app/entrypoint.py

USER worker

WORKDIR /workspace

ENTRYPOINT ["python3", "/app/entrypoint.py"]
