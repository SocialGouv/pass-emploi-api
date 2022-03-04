#!/bin/bash

if [[ $APP =~ "pa-back-staging-pr" ]] ; then
  echo "Dump de la DB de staging"
  dbclient-fetcher psql
  pg_dump --clean --if-exists --format c --no-owner --no-privileges --no-comments --exclude-schema 'information_schema' --exclude-schema '^pg_*' --exclude-schema 'topology' --dbname $STAGING_DATABASE_URL --file dump.pgsql
  pg_restore --clean --if-exists --no-owner --no-privileges --no-comments --dbname $DATABASE_URL dump.pgsql
fi

yarn migration
