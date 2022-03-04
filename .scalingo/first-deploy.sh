#!/bin/bash

echo "First deploy"

if [[ $APP =~ "pa-back-staging-pr" ]] ; then
  echo "Dump de la DB de staging"
  dbclient-fetcher psql
  psql --dbname $DATABASE_URL -c "CREATE extension postgis;"
  psql --dbname $DATABASE_URL -c "CREATE extension postgis_tiger_geocoder CASCADE;"
  psql --dbname $DATABASE_URL -c "CREATE extension postgis_topology;"
  pg_dump --clean --if-exists --format c --no-owner --no-privileges --no-comments --schema 'sequelize' --schema 'public' --exclude-schema 'topology' --dbname $STAGING_DATABASE_URL --file dump.pgsql
  pg_restore --clean --if-exists --no-owner --no-privileges --no-comments --dbname $DATABASE_URL dump.pgsql
fi

yarn migration
