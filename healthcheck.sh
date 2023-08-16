#!/bin/sh

if [ "$ENABLE_HTTPS" = "TRUE" ]
then
  curl -k -f https://$BASE_URL:$PORT/healthcheck || exit 1
else
  curl -f http://$BASE_URL:$PORT/healthcheck || exit 1
fi