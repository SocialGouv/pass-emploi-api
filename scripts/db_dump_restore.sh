#!/usr/bin/env bash

echo "dump cej db and restore to another"

#DUMP_RESTORE_DB_SOURCE=
#DUMP_RESTORE_DB_TARGET=
#DUMP_RESTORE_DB_FORCE=

if [[ $APP != "pa-back-prod" ]] && [[ $DUMP_RESTORE_DB_FORCE != 'true' ]] ; then
  echo "error: must run only on prod"
  exit 1
fi

if [[ $DUMP_RESTORE_DB_SOURCE = $DUMP_RESTORE_DB_TARGET ]] ; then
  echo "error: source must be different from target"
  exit 1
fi

if [ -z "$DUMP_RESTORE_DB_SOURCE" ]
then
  echo "error: env var DUMP_RESTORE_DB_SOURCE must be set"
  exit 1
fi

if [ -z "$DUMP_RESTORE_DB_TARGET" ]
then
  echo "error: env var DUMP_RESTORE_DB_TARGET must be set"
  exit 1
fi

export PATH=$HOME/bin:$PATH
dbclient-fetcher psql 13

pg_dump --clean --if-exists --format c --dbname "$DUMP_RESTORE_DB_SOURCE" --no-owner --no-privileges --no-comments --schema 'public' --file dump.pgsql \
  --exclude-table 'spatial_ref_sys' \
  --exclude-table 'log_api_partenaire' \
  --exclude-table 'suivi_job' \
  --exclude-table 'evenement_engagement_hebdo'
echo "dump OK"

psql -d ${DUMP_RESTORE_DB_TARGET} \
  -c "DROP EXTENSION IF EXISTS postgis CASCADE;" \
  -c "DROP EXTENSION IF EXISTS postgis_tiger_geocoder CASCADE;" \
  -c "DROP EXTENSION IF EXISTS postgis_topology CASCADE;" \
  -c "DROP EXTENSION IF EXISTS pg_trgm CASCADE;" \
  -c "CREATE EXTENSION IF NOT EXISTS postgis SCHEMA public;" \
  -c "CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder CASCADE SCHEMA public;" \
  -c "CREATE EXTENSION IF NOT EXISTS postgis_topology SCHEMA topology;" \
  -c "CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public;"
echo "extensions OK"

pg_restore --clean --if-exists --no-owner --no-privileges --no-comments --dbname "${DUMP_RESTORE_DB_TARGET}" dump.pgsql

echo "restore OK"

psql -d ${DUMP_RESTORE_DB_TARGET} \
  -c "create index evenement_engagement_date_evenement_index on evenement_engagement (date_evenement);" \
  -c "create index evenement_engagement_categorie_index on evenement_engagement (categorie);" \
  -c "create index evenement_engagement_action_index on evenement_engagement (action);" \
  -c "create index evenement_engagement_nom_index on evenement_engagement (nom);" \
  -c "create index evenement_engagement_id_utilisateur_index on evenement_engagement (id_utilisateur);" \
  -c "create index evenement_engagement_type_utilisateur_index on evenement_engagement (type_utilisateur);" \
  -c "create index evenement_engagement_structure_index on evenement_engagement (structure);" \
  -c "create index evenement_engagement_code_index on evenement_engagement (code);"

echo "index OK"

rm -f dump.pgsql
