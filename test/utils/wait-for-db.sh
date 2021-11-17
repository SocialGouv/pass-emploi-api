#!/usr/bin/env bash

attempt_counter=0
max_attempts=20

APIDB_NAME=$(docker-compose ps | grep testdb | cut -f1 -d ' ')
if [[ -z "$APIDB_NAME" ]]; then
  echo local API DB seems not started! >&2
  exit 1
fi
until $(docker exec -i ${APIDB_NAME} psql --dbname test -U test -h localhost  -c 'SELECT 1' &>/dev/null); do
  if [ ${attempt_counter} -eq ${max_attempts} ];then
    echo "Max attempts reached"
    exit 1
   fi
  printf '.'
  attempt_counter=$(($attempt_counter+1))
  sleep 1
done
