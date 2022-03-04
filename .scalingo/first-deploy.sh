#!/bin/bash

echo "First deploy"

if [[ $APP =~ "pa-back-staging-pr" ]] ; then
  echo "Dump de la DB de staging"
  dbclient-fetcher psql
  psql --dbname $STAGING_DATABASE_URL -c "CREATE extension postgis;"
  psql --dbname $STAGING_DATABASE_URL -c "CREATE extension postgis_tiger_geocoder CASCADE;"
  psql --dbname $STAGING_DATABASE_URL -c "CREATE extension postgis_topology;"
  pg_dump --format c --data-only --no-owner --no-privileges --no-comments --schema 'sequelize' --schema 'public' --dbname $STAGING_DATABASE_URL --file dump.pgsql
  pg_restore --clean --if-exists --no-owner --no-privileges --no-comments --dbname $DATABASE_URL dump.pgsql
fi

yarn migration
