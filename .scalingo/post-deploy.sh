#!/bin/bash

if [[ $APP =~ "pa-back-staging-pr" ]] ; then
  echo "Dump de la DB de staging"
  dbclient-fetcher psql
  pg_dump --format c --data-only --no-owner --no-privileges --no-comments --schema 'sequelize' --schema 'public' --dbname $STAGING_DATABASE_URL --file dump.pgsql
  pg_restore --clean --if-exists --no-owner --no-privileges --no-comments --dbname $DATABASE_URL dump.pgsql
fi

yarn migration
