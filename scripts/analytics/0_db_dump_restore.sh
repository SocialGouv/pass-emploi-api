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
  -c "CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public;" \
  -c "drop index IF EXISTS evenement_engagement_date_evenement_index;" \
  -c "drop index IF EXISTS evenement_engagement_categorie_index;" \
  -c "drop index IF EXISTS evenement_engagement_action_index;" \
  -c "drop index IF EXISTS evenement_engagement_nom_index;" \
  -c "drop index IF EXISTS evenement_engagement_id_utilisateur_index;" \
  -c "drop index IF EXISTS evenement_engagement_type_utilisateur_index;" \
  -c "drop index IF EXISTS evenement_engagement_structure_index;" \
  -c "drop index IF EXISTS evenement_engagement_code_index;"
echo "extensions crées et index supprimés"

pg_restore --clean --if-exists --no-owner --no-privileges --no-comments --dbname "${DUMP_RESTORE_DB_TARGET}" dump.pgsql

if [ $? -ne 0 ]; then
  echo "Error: pg_restore command failed gracefully"
fi
echo "pg_restore OK"

rm -f dump.pgsql

psql -d ${DUMP_RESTORE_DB_TARGET} \
  -c "create index evenement_engagement_date_evenement_index on evenement_engagement (date_evenement);" \
  -c "create index evenement_engagement_categorie_index on evenement_engagement (categorie);" \
  -c "create index evenement_engagement_action_index on evenement_engagement (action);" \
  -c "create index evenement_engagement_nom_index on evenement_engagement (nom);" \
  -c "create index evenement_engagement_id_utilisateur_index on evenement_engagement (id_utilisateur);" \
  -c "create index evenement_engagement_type_utilisateur_index on evenement_engagement (type_utilisateur);" \
  -c "create index evenement_engagement_structure_index on evenement_engagement (structure);" \
  -c "create index evenement_engagement_code_index on evenement_engagement (code);"

if [ $? -ne 0 ]; then
  echo "Error: index creation failed"
  exit 1
fi
echo "index creation OK"
