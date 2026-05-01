#!/bin/sh
set -eu

pool setup --api-key "$POOLSIDE_API_KEY" >&2

exec pool acp "$@"
