#!/usr/bin/env bash

echo "dump cej db and restore to another"

#DUMP_RESTORE_DB_SOURCE=
#DUMP_RESTORE_DB_TARGET=
#DUMP_RESTORE_DB_FORCE=

if [[ $APP != "pa-back-prod" ]] && [[ $DUMP_RESTORE_DB_FORCE != 'true' ]]; then
  echo "error: must run only on prod"
  exit 1
fi

if [[ $DUMP_RESTORE_DB_SOURCE = $DUMP_RESTORE_DB_TARGET ]]; then
  echo "error: source must be different from target"
  exit 1
fi

if [ -z "$DUMP_RESTORE_DB_SOURCE" ]; then
  echo "error: env var DUMP_RESTORE_DB_SOURCE must be set"
  exit 1
fi

if [ -z "$DUMP_RESTORE_DB_TARGET" ]; then
  echo "error: env var DUMP_RESTORE_DB_TARGET must be set"
  exit 1
fi

export PATH=$HOME/bin:$PATH
dbclient-fetcher psql 13

pg_dump --clean --if-exists --format c --dbname "$DUMP_RESTORE_DB_SOURCE" --no-owner --no-privileges --no-comments --schema 'public' --exclude-schema=schema --file dump.pgsql \
  --exclude-table 'spatial_ref_sys' \
  --exclude-table 'log_api_partenaire' \
  --exclude-table 'suivi_job' \
  --exclude-table 'evenement_engagement' \
  --exclude-table 'evenement_engagement_hebdo'

if [ $? -ne 0 ]; then
  echo "Error: pg_dump command failed"
  exit 1
fi
echo "pg_dump OK"

psql -d ${DUMP_RESTORE_DB_TARGET} \
  -c "CREATE EXTENSION IF NOT EXISTS postgis SCHEMA public;" \
  -c "CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder CASCADE SCHEMA public;" \
  -c "CREATE EXTENSION IF NOT EXISTS postgis_topology SCHEMA topology;" \
  -c "CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public;"

echo "extensions crées"

pg_restore --clean --if-exists --no-owner --no-privileges --no-comments --dbname "${DUMP_RESTORE_DB_TARGET}" dump.pgsql

if [ $? -ne 0 ]; then
  echo "Error: pg_restore command failed gracefully"
fi
echo "pg_restore OK"

rm -f dump.pgsql
