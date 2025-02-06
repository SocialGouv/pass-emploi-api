#!/usr/bin/env bash

if [[ $APP =~ "pa-back-prod-test" ]] ; then
  echo "Dump de la DB de prod vers la db de perfs"

  if [ -z "$PROD_DATABASE_URL" ]; then
    echo "error: env var PROD_DATABASE_URL must be set"
    exit 1
  fi

  if [ -z "$DATABASE_URL" ]; then
    echo "error: env var DATABASE_URL must be set"
    exit 1
  fi

  if [[ $DATABASE_URL == *"pa_back_pro_817"* ]]; then
    echo "Error: Target must not be production"
    exit 1
  fi

  export PATH=$HOME/bin:$PATH
  dbclient-fetcher psql 13

  echo "Drop conflicting extensions (if they exist)"
  psql --dbname $DATABASE_URL -c "DROP EXTENSION IF EXISTS postgis CASCADE;"
  psql --dbname $DATABASE_URL -c "DROP EXTENSION IF EXISTS postgis_tiger_geocoder CASCADE;"
  psql --dbname $DATABASE_URL -c "DROP EXTENSION IF EXISTS postgis_topology CASCADE;"
  psql --dbname $DATABASE_URL -c "DROP EXTENSION IF EXISTS pg_trgm CASCADE;"

  echo "Dump production database (excluding unnecessary schemas)"
  pg_dump --clean --if-exists --format c --no-owner --no-privileges --no-comments \
    -n 'public' -n 'sequelize' \
    --exclude-schema 'information_schema' --exclude-schema '^pg_*' \
    --exclude-schema 'tiger' --exclude-schema 'tiger_data' --exclude-schema 'topology' \
    --dbname $PROD_DATABASE_URL --file dump.pgsql

  echo "Restore database dump (WITHOUT extensions yet)"
  pg_restore --clean --if-exists --no-owner --no-privileges --no-comments --dbname $DATABASE_URL dump.pgsql

  echo "Recreate extensions AFTER restore"
  psql --dbname $DATABASE_URL -c "CREATE EXTENSION postgis;"
  psql --dbname $DATABASE_URL -c "CREATE EXTENSION postgis_tiger_geocoder CASCADE;"
  psql --dbname $DATABASE_URL -c "CREATE EXTENSION postgis_topology;"
  psql --dbname $DATABASE_URL -c "CREATE EXTENSION pg_trgm;"

  echo "Grant correct privileges"
  psql --dbname $DATABASE_URL -c "GRANT USAGE, CREATE ON SCHEMA public TO pa_back_pro_4110;"
  psql --dbname $DATABASE_URL -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pa_back_pro_4110;"

fi

rm -f dump.pgsql
