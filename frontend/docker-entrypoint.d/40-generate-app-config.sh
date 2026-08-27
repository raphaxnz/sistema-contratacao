#!/bin/sh
set -eu

envsubst '${APP_MODE} ${API_BASE_URL}' \
  < /usr/share/nginx/html/config.template.js \
  > /usr/share/nginx/html/config.js
