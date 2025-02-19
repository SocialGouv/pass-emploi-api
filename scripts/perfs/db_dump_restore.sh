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

  echo "Anonymizing email addresses in jeune table"
  psql --dbname $DATABASE_URL -c "UPDATE jeune SET email = 'email@email.com', nom='test', prenom='test', push_notification_token='plop', id_partenaire='plop' WHERE id != 'e88a3b2a-e994-11ed-a05b-0242ac120003';"
  psql --dbname $DATABASE_URL -c "UPDATE conseiller SET email = 'email@email.com', nom='test', prenom='test', username='plop', id_authentification='plop';"
  psql --dbname $DATABASE_URL -c "UPDATE rendez_vous SET titre='test', commentaire='plop', modalite='plop', adresse='plop';"
  psql --dbname $DATABASE_URL -c "UPDATE action SET contenu='test', description='test', qualification_commentaire='plop';"

  echo "Recreate extensions AFTER restore"
  psql --dbname $DATABASE_URL -c "CREATE EXTENSION postgis;"
  psql --dbname $DATABASE_URL -c "CREATE EXTENSION postgis_tiger_geocoder CASCADE;"
  psql --dbname $DATABASE_URL -c "CREATE EXTENSION postgis_topology;"
  psql --dbname $DATABASE_URL -c "CREATE EXTENSION pg_trgm;"

  echo "Grant correct privileges"
  psql --dbname $DATABASE_URL -c "GRANT USAGE, CREATE ON SCHEMA public TO pa_back_pro_3082;"
  psql --dbname $DATABASE_URL -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pa_back_pro_3082;"

  echo "Adding Data"
  psql --dbname $DATABASE_URL -c "CREATE TABLE IF NOT EXISTS recherche (
    id UUID PRIMARY KEY,
    id_jeune VARCHAR(255) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    metier VARCHAR(255),
    localisation VARCHAR(255),
    criteres JSONB NOT NULL,
    date_creation TIMESTAMPTZ DEFAULT NOW(),
    date_derniere_recherche TIMESTAMPTZ DEFAULT NOW(),
    etat_derniere_recherche VARCHAR(255) DEFAULT 'SUCCES',
    geometrie GEOMETRY(Polygon, 4326),
    CONSTRAINT fk_id_jeune FOREIGN KEY (id_jeune) REFERENCES jeune(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_recherche_id_jeune ON recherche(id_jeune);"

  psql --dbname $DATABASE_URL -c "INSERT INTO recherche (
    id, id_jeune, titre, type, metier, localisation, criteres, 
    date_creation, date_derniere_recherche, etat_derniere_recherche, geometrie
)
SELECT 
    gen_random_uuid(), -- Generates a unique UUID for each row
    'e88a3b2a-e994-11ed-a05b-0242ac120003',
    'Titre ' || s, 
    'Type ' || s, 
    'Metier ' || s, 
    'Localisation ' || s, 
    '{}'::jsonb, -- Empty JSON object
    NOW() - (random() * interval '365 days'), -- Random date within the last year
    NOW(),
    'SUCCES',
    NULL
FROM generate_series(1, 200000) s;"

fi

rm -f dump.pgsql
