import os

# backend.config.settings loads the repo-root .env at import time, so without this
# the suite would inherit a developer's local flags — an ALLOW_UNAUTHORIZED_TARGETS=true
# in someone's .env silently turns every scope-authorization assertion green.
# _load_dotenv() uses setdefault, so values pinned here win.
os.environ["ALLOW_UNAUTHORIZED_TARGETS"] = "false"
os.environ["DEFAULT_AUTHORIZED_SUBNETS"] = "10.10.14.0/24,192.168.10.0/24,127.0.0.1/32,localhost"
