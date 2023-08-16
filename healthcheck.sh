#!/bin/sh

if [ "$ENABLE_HTTPS" = "TRUE" ]
then
  curl -k -f https://localhost:$PORT/healthcheck || exit 1
else
  curl -f http://localhost:$PORT/healthcheck || exit 1
fi