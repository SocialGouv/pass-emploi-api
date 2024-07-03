import { Sequelize } from 'sequelize-typescript'

export async function chargerLaVueFonctionnalite(
  connexion: Sequelize,
  semaine: string
): Promise<void> {
  await connexion.query(
    `DELETE
     from analytics_fonctionnalites
     where semaine = '${semaine}';`
  )
  await connexion.query(`
    insert into analytics_fonctionnalites(semaine,
                                          structure,
                                          type_utilisateur,
                                          categorie,
                                          action,
                                          nom,
                                          nb_ae_categorie,
                                          nb_users_categorie,
                                          nb_ae_action,
                                          nb_users_action,
                                          nb_ae_nom,
                                          nb_users_nom,
                                          nb_ae_total,
                                          nb_users_total)
    WITH
  duplication_action AS (
    SELECT
      date_evenement,
      id_utilisateur,
      1 AS is_duplication
    FROM
      evenement_engagement
    WHERE
      code = 'ACTION_DUPLIQUEE'
      and semaine = '${semaine}'
  ),
  evenement_engagement_dup AS (
    SELECT
      evenement_engagement.*,
      CASE is_duplication
        WHEN 1 THEN 1
        ELSE 0
      END AS is_duplication
    FROM
      evenement_engagement
      LEFT JOIN duplication_action ON evenement_engagement.date_evenement = duplication_action.date_evenement
      AND evenement_engagement.id_utilisateur = duplication_action.id_utilisateur
  ),
  evenement_engagement_filtered AS (
    SELECT
      *
    FROM
      evenement_engagement_dup
    WHERE
      (is_duplication != 1)
      OR (ACTION = 'Duplication')
  )
SELECT
  table_nom.semaine,
  table_nom.structure,
  table_nom.type_utilisateur,
  table_nom.categorie,
  table_nom.action,
  table_nom.nom,
  MIN(nb_ae_categorie) AS nb_ae_categorie,
  MIN(nb_users_categorie) AS nb_users_categorie,
  MIN(nb_ae_action) AS nb_ae_action,
  MIN(nb_users_action) AS nb_users_action,
  MIN(nb_ae_nom) AS nb_ae_nom,
  MIN(nb_users_nom) AS nb_users_nom,
  MIN(nb_ae) AS nb_ae_total,
  MIN(nb_users_tot) AS nb_users_total
FROM
  (
    SELECT
      COUNT(DISTINCT id_utilisateur) AS nb_users_nom,
      count(*) AS nb_ae_nom,
      semaine,
      categorie,
      ACTION,
      nom,
      structure,
      type_utilisateur
    FROM
      evenement_engagement_filtered
    WHERE
      structure IS NOT NULL
      AND structure != 'PASS_EMPLOI'
      and semaine = '${semaine}'
    GROUP BY
      semaine,
      structure,
      categorie,
      ACTION,
      nom,
      type_utilisateur
  ) AS table_nom
  INNER JOIN (
    SELECT
      COUNT(DISTINCT id_utilisateur) AS nb_users_action,
      count(*) AS nb_ae_action,
      semaine,
      type_utilisateur,
      structure,
      categorie,
      ACTION
    FROM
      evenement_engagement_filtered
    WHERE
      structure IS NOT NULL
      AND structure != 'PASS_EMPLOI'
      and semaine = '${semaine}'
    GROUP BY
      semaine,
      structure,
      categorie,
      ACTION,
      type_utilisateur
  ) AS table_action ON table_nom.semaine = table_action.semaine
  AND table_nom.structure = table_action.structure
  AND table_nom.type_utilisateur = table_action.type_utilisateur
  AND table_nom.categorie = table_action.categorie
  AND table_nom.action = table_action.action
  INNER JOIN (
    SELECT
      COUNT(DISTINCT id_utilisateur) AS nb_users_categorie,
      count(*) AS nb_ae_categorie,
      semaine,
      structure,
      type_utilisateur,
      categorie
    FROM
      evenement_engagement_filtered
    WHERE
      structure IS NOT NULL
      AND structure != 'PASS_EMPLOI'
      and semaine = '${semaine}'
    GROUP BY
      semaine,
      structure,
      categorie,
      type_utilisateur
  ) AS table_cat ON table_nom.semaine = table_cat.semaine
  AND table_nom.structure = table_cat.structure
  AND table_nom.type_utilisateur = table_cat.type_utilisateur
  AND table_nom.categorie = table_cat.categorie
  INNER JOIN (
    SELECT
      count(*) AS nb_ae,
      COUNT(DISTINCT id_utilisateur) AS nb_users_tot,
      semaine,
      structure,
      type_utilisateur
    FROM
      evenement_engagement_filtered
    WHERE
      structure IS NOT NULL
      AND structure != 'PASS_EMPLOI'
      and semaine = '${semaine}'
    GROUP BY
      semaine,
      structure,
      type_utilisateur
  ) AS table_tot ON table_nom.semaine = table_tot.semaine
  AND table_nom.structure = table_tot.structure
  AND table_nom.type_utilisateur = table_tot.type_utilisateur
GROUP BY
  table_nom.semaine,
  table_nom.structure,
  table_nom.categorie,
  table_nom.action,
  table_nom.nom,
  table_nom.type_utilisateur
ORDER BY
    table_nom.semaine DESC,
  table_nom.structure,
  table_nom.type_utilisateur,
  table_nom.categorie,
  table_nom.action,
  table_nom.nom;
  `)
}
