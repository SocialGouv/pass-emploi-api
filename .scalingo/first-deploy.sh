#!/bin/bash

echo "First deploy"

if [[ $APP =~ "pa-back-staging-pr" ]] ; then
  echo "Dump de la DB de staging"

  if [[ $DATABASE_URL == *"pa_back_pro_817"* ]]; then
    echo "Error: Target must not be production"
    exit 1
  fi

  export PATH=$HOME/bin:$PATH
  dbclient-fetcher psql 13
  psql --dbname $DATABASE_URL -c "CREATE extension postgis;"
  psql --dbname $DATABASE_URL -c "CREATE extension postgis_tiger_geocoder CASCADE;"
  psql --dbname $DATABASE_URL -c "CREATE extension postgis_topology;"
  psql --dbname $DATABASE_URL -c "CREATE extension pg_trgm;"
  pg_dump --clean --if-exists --format c --no-owner --no-privileges --no-comments -n 'public' -n 'sequelize' --exclude-schema 'information_schema' --exclude-schema '^pg_*' --exclude-schema 'tiger' --exclude-schema 'tiger_data' --exclude-schema 'topology' --dbname $STAGING_DATABASE_URL --file dump.pgsql
  pg_restore --clean --if-exists --no-owner --no-privileges --no-comments --dbname $DATABASE_URL dump.pgsql
fi

yarn migration