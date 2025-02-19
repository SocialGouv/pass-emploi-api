#!/bin/bash

echo "Post deploy"

if [[ $APP =~ "pa-back-staging-pr" ]] ; then
  echo "Dump de la DB de staging"

  if [[ $DATABASE_URL == *"pa_back_pro_817"* ]]; then
    echo "Error: Target must not be production"
    exit 1
  fi

  export PATH=$HOME/bin:$PATH
  dbclient-fetcher psql 13
  pg_dump --clean --if-exists --format c --no-owner --no-privileges --no-comments -n 'public' -n 'sequelize' --exclude-schema 'information_schema' --exclude-schema '^pg_*' --exclude-schema 'tiger' --exclude-schema 'tiger_data' --exclude-schema 'topology' --dbname $STAGING_DATABASE_URL --file dump.pgsql
  psql --dbname $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder; CREATE EXTENSION IF NOT EXISTS pg_trgm;"
  pg_restore --clean --if-exists --no-owner --no-privileges --no-comments --dbname $DATABASE_URL dump.pgsql
fi

if [[ ! $APP =~ "pa-back-prod-test" ]] ; then
  yarn migration
fi

