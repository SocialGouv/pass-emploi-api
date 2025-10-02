import { Sequelize } from 'sequelize-typescript'

export const ANALYTICS_FCT_DEMARCHES_IA_TABLE_NAME =
  'analytics_fonctionnalites_demarches_ia'

export async function migrate(connexion: Sequelize): Promise<void> {
  await connexion.query(`
    CREATE TABLE IF NOT EXISTS analytics_fonctionnalites
    (
      semaine            date,
      structure          varchar,
      type_utilisateur   varchar,
      categorie          varchar,
      action             varchar,
      nom                varchar,
      nb_ae_categorie    integer,
      nb_users_categorie integer,
      nb_ae_action       integer,
      nb_users_action    integer,
      nb_ae_nom          integer,
      nb_users_nom       integer,
      nb_ae_total        integer,
      nb_users_total     integer
    );
  `)

  await connexion.query(`
    CREATE TABLE IF NOT EXISTS ${ANALYTICS_FCT_DEMARCHES_IA_TABLE_NAME}
    (
      semaine            date,
      structure          varchar,
      type_utilisateur   varchar,
      categorie          varchar,
      action             varchar,
      nom                varchar,
      nb_ae_categorie    integer,
      nb_users_categorie integer,
      nb_ae_action       integer,
      nb_users_action    integer,
      nb_ae_nom          integer,
      nb_users_nom       integer,
      nb_ae_total        integer,
      nb_users_total     integer
    );
  `)

  await connexion.query(`
      CREATE TABLE IF NOT EXISTS analytics_engagement
      (
          semaine                                             date,
          structure                                           varchar,
          type_utilisateur                                    varchar,
          region                                              varchar,
          departement                                         varchar,
          nombre_utilisateurs_2_mois                          integer,
          nombre_utilisateurs_1_mois                          integer,
          nombre_utilisateurs_engages_2_jours_dans_la_semaine integer,
          nb_actifs_3_semaines_sur_6                          integer,
          nb_actifs_4_semaines_sur_6                          integer
      );
  `)

  await connexion.query(`
    CREATE TABLE IF NOT EXISTS analytics_engagement_national
    (
        semaine                                             date,
        structure                                           varchar,
        type_utilisateur                                    varchar,
        nombre_utilisateurs_2_mois                          integer,
        nombre_utilisateurs_1_mois                          integer,
        nombre_utilisateurs_engages_2_jours_dans_la_semaine integer,
        nb_actifs_3_semaines_sur_6                          integer,
        nb_actifs_4_semaines_sur_6                          integer
    );
`)

  await connexion.query(`
    create index if not exists analytics_fonctionnalites_semaine_index on analytics_fonctionnalites (semaine);
    create index if not exists analytics_fonctionnalites_structure_index on analytics_fonctionnalites (structure);
    create index if not exists analytics_fonctionnalites_type_utilisateur_index on analytics_fonctionnalites (type_utilisateur);
    create index if not exists analytics_fonctionnalites_categorie_index on analytics_fonctionnalites (categorie);
    create index if not exists analytics_fonctionnalites_action_index on analytics_fonctionnalites (action);
    create index if not exists analytics_fonctionnalites_nom_index on analytics_fonctionnalites (nom);
    create index if not exists ${ANALYTICS_FCT_DEMARCHES_IA_TABLE_NAME}_semaine_index on ${ANALYTICS_FCT_DEMARCHES_IA_TABLE_NAME} (semaine);
    create index if not exists ${ANALYTICS_FCT_DEMARCHES_IA_TABLE_NAME}_structure_index on ${ANALYTICS_FCT_DEMARCHES_IA_TABLE_NAME} (structure);
    create index if not exists ${ANALYTICS_FCT_DEMARCHES_IA_TABLE_NAME}_type_utilisateur_index on ${ANALYTICS_FCT_DEMARCHES_IA_TABLE_NAME} (type_utilisateur);
    create index if not exists ${ANALYTICS_FCT_DEMARCHES_IA_TABLE_NAME}_categorie_index on ${ANALYTICS_FCT_DEMARCHES_IA_TABLE_NAME} (categorie);
    create index if not exists ${ANALYTICS_FCT_DEMARCHES_IA_TABLE_NAME}_action_index on ${ANALYTICS_FCT_DEMARCHES_IA_TABLE_NAME} (action);
    create index if not exists ${ANALYTICS_FCT_DEMARCHES_IA_TABLE_NAME}_nom_index on ${ANALYTICS_FCT_DEMARCHES_IA_TABLE_NAME} (nom);
    create index if not exists analytics_engagement_semaine_index on analytics_engagement (semaine);
    create index if not exists analytics_engagement_structure_index on analytics_engagement (structure);
    create index if not exists analytics_engagement_type_utilisateur_index on analytics_engagement (type_utilisateur);
    create index if not exists analytics_engagement_region_index on analytics_engagement (region);
    create index if not exists analytics_engagement_departement_index on analytics_engagement (departement);
    create index if not exists analytics_engagement_national_semaine_index on analytics_engagement_national (semaine);
    create index if not exists analytics_engagement_national_structure_index on analytics_engagement_national (structure);
    create index if not exists analytics_engagement_national_type_utilisateur_index on analytics_engagement_national (type_utilisateur);
  `)
}
