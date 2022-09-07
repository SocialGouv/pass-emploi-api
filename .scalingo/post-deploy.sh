#!/bin/bash

if [[ $APP =~ "pa-back-staging-pr" ]] ; then
  echo "Dump de la DB de staging"
  dbclient-fetcher psql
  pg_dump --clean --if-exists --format c --no-owner --no-privileges --no-comments -n 'public' -n 'sequelize' --exclude-schema 'information_schema' --exclude-schema '^pg_*' --exclude-schema 'tiger' --exclude-schema 'tiger_data' --exclude-schema 'topology' --exclude-schema 'spatial_ref_sys' --dbname $STAGING_DATABASE_URL --file dump.pgsql
  pg_restore --clean --if-exists --no-owner --no-privileges --no-comments --exclude-schema 'public' --dbname $DATABASE_URL dump.pgsql
fi

yarn migration

