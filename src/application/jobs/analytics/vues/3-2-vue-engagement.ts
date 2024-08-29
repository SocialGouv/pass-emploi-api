import { Sequelize } from 'sequelize-typescript'
import { Logger } from '@nestjs/common'

export async function chargerLaVueEngagement(
  connexion: Sequelize,
  semaine: string,
  logger: Logger,
  analyticsTableName: string
): Promise<void> {
  logger.log(
    `Suppression des données de la semaine ${semaine} de la vue analytics_engagement`
  )
  await connexion.query(
    `DELETE
     from analytics_engagement
     where semaine = '${semaine}';`
  )

  logger.log('Insertion des utilisateurs des 2 derniers mois')
  await connexion.query(
    `insert into analytics_engagement(semaine,
                                      structure,
                                      type_utilisateur,
                                      region,
                                      departement,
                                      nombre_utilisateurs_2_mois)
     SELECT '${semaine}',
            structure,
            type_utilisateur,
            COALESCE(region, 'NON RENSEIGNE') AS region,
            COALESCE(departement, 'NON RENSEIGNE') AS departement,
            count(distinct id_utilisateur) as nombre_utilisateurs_2_mois
     from ${analyticsTableName}
     where date_evenement between '${semaine}'::timestamp - interval '2 months' and '${semaine}'::timestamp + interval '1 week'
     group by structure, type_utilisateur, departement, region
     order by structure, type_utilisateur, region, departement;`
  )

  logger.log('Insertion des utilisateurs du dernier mois')
  await connexion.query(
    `insert into analytics_engagement(semaine,
                                      structure,
                                      type_utilisateur,
                                      region,
                                      departement,
                                      nombre_utilisateurs_1_mois)
     SELECT '${semaine}',
            structure,
            type_utilisateur,
            COALESCE(region, 'NON RENSEIGNE') AS region,
            COALESCE(departement, 'NON RENSEIGNE') AS departement,
            count(distinct id_utilisateur) as nombre_utilisateurs_1_mois
     from ${analyticsTableName}
     where date_evenement between '${semaine}'::timestamp - interval '1 months' and '${semaine}'::timestamp + interval '1 week'
     group by structure, type_utilisateur, departement, region
     order by structure, type_utilisateur, region, departement;`
  )

  logger.log('Insertion des utilisateurs engagés')
  await connexion.query(
    `update analytics_engagement
     SET nombre_utilisateurs_engages_2_jours_dans_la_semaine = subquery.nombre_utilisateurs_engages_2_jours_dans_la_semaine
     FROM (SELECT count(distinct x.id_utilisateur) as nombre_utilisateurs_engages_2_jours_dans_la_semaine,
                  x.semaine,
                  x.departement,
                  x.region,
                  x.structure,
                  x.type_utilisateur
           FROM (SELECT count(distinct jour) as nb_day_ae,
                        semaine,
                        COALESCE(region, 'NON RENSEIGNE') AS region,
                        COALESCE(departement, 'NON RENSEIGNE') AS departement,
                        structure,
                        type_utilisateur,
                        id_utilisateur
                 FROM ${analyticsTableName}
                 WHERE semaine = '${semaine}'
                 GROUP BY semaine, id_utilisateur, semaine, departement, region, structure, type_utilisateur) x
           WHERE nb_day_ae >= 2
           GROUP BY x.semaine, x.departement, x.region, x.structure, x.type_utilisateur) as subquery
     WHERE analytics_engagement.semaine = '${semaine}'
       AND analytics_engagement.departement = subquery.departement
       AND analytics_engagement.region = subquery.region
       AND analytics_engagement.structure = subquery.structure
       AND analytics_engagement.type_utilisateur = subquery.type_utilisateur;`
  )

  logger.log('Insertion des utilisateurs actifs 3 semaines sur 6')
  await connexion.query(
    `update analytics_engagement
     SET nb_actifs_3_semaines_sur_6 = subquery.nb_actifs_3_semaines_sur_6
     FROM (SELECT structure,
                  type_utilisateur,
                  region,
                  departement,
                  count(*) as nb_actifs_3_semaines_sur_6
           FROM (SELECT count(distinct week_ae) as nb_week,
                        id_utilisateur,
                        structure,
                        type_utilisateur,
                        region,
                        departement
                 FROM (SELECT count(distinct jour) as nb_day_ae,
                              semaine              as week_ae,
                              structure,
                              type_utilisateur,
                              COALESCE(region, 'NON RENSEIGNE') AS region,
                              COALESCE(departement, 'NON RENSEIGNE') AS departement,
                              id_utilisateur
                       FROM ${analyticsTableName}
                       WHERE date_evenement between '${semaine}'::timestamp - interval '5 week' and '${semaine}'::timestamp + interval '1 week'
                       GROUP BY week_ae, id_utilisateur, structure, region, departement, type_utilisateur) ee
                 WHERE nb_day_ae >= 2
                 GROUP BY id_utilisateur, structure, region, departement, type_utilisateur) x
           WHERE nb_week >= 3
           GROUP BY structure, type_utilisateur, region, departement
           ORDER BY structure, type_utilisateur, region, departement) as subquery
     WHERE analytics_engagement.semaine = '${semaine}'
       AND analytics_engagement.departement = subquery.departement
       AND analytics_engagement.region = subquery.region
       AND analytics_engagement.structure = subquery.structure
       AND analytics_engagement.type_utilisateur = subquery.type_utilisateur;`
  )

  logger.log('Insertion des utilisateurs actifs 4 semaines sur 6')
  await connexion.query(
    `update analytics_engagement
     SET nb_actifs_4_semaines_sur_6 = subquery.nb_actifs_4_semaines_sur_6
     FROM (SELECT structure,
                  type_utilisateur,
                  region,
                  departement,
                  count(*) as nb_actifs_4_semaines_sur_6
           FROM (SELECT count(distinct week_ae) as nb_week,
                        id_utilisateur,
                        structure,
                        type_utilisateur,
                        region,
                        departement
                 FROM (SELECT count(distinct jour) as nb_day_ae,
                              semaine              as week_ae,
                              structure,
                              type_utilisateur,
                              COALESCE(region, 'NON RENSEIGNE') AS region,
                              COALESCE(departement, 'NON RENSEIGNE') AS departement,
                              id_utilisateur
                       FROM ${analyticsTableName}
                       WHERE date_evenement between '${semaine}'::timestamp - interval '5 week' and '${semaine}'::timestamp + interval '1 week'
                       GROUP BY week_ae, id_utilisateur, structure, region, departement, type_utilisateur) ee
                 WHERE nb_day_ae >= 2
                 GROUP BY id_utilisateur, structure, region, departement, type_utilisateur) x
           WHERE nb_week >= 4
           GROUP BY structure, type_utilisateur, region, departement
           ORDER BY structure, type_utilisateur, region, departement) as subquery
     WHERE analytics_engagement.semaine = '${semaine}'
       AND analytics_engagement.departement = subquery.departement
       AND analytics_engagement.region = subquery.region
       AND analytics_engagement.structure = subquery.structure
       AND analytics_engagement.type_utilisateur = subquery.type_utilisateur;`
  )

  logger.log('Remplacer les null par des 0')
  await connexion.query(
    ` UPDATE analytics_engagement
      SET nombre_utilisateurs_2_mois = 0
      WHERE nombre_utilisateurs_2_mois IS NULL;

      UPDATE analytics_engagement
      SET nombre_utilisateurs_engages_2_jours_dans_la_semaine = 0
      WHERE nombre_utilisateurs_engages_2_jours_dans_la_semaine IS NULL;

      UPDATE analytics_engagement
      SET nb_actifs_3_semaines_sur_6 = 0
      WHERE analytics_engagement.nb_actifs_3_semaines_sur_6 IS NULL;

      UPDATE analytics_engagement
      SET nb_actifs_4_semaines_sur_6 = 0
      WHERE analytics_engagement.nb_actifs_4_semaines_sur_6 IS NULL;
    `
  )
}

export async function chargerLaVueEngagementNational(
  connexion: Sequelize,
  semaine: string,
  logger: Logger,
  analyticsTableName: string
): Promise<void> {
  logger.log(
    `Suppression des données de la semaine ${semaine} de la vue analytics_engagement_national`
  )
  await connexion.query(
    `DELETE
     from analytics_engagement_national
     where semaine = '${semaine}';`
  )

  logger.log('Insertion des utilisateurs des 2 derniers mois')
  await connexion.query(
    `insert into analytics_engagement_national(semaine,
                                              structure,
                                              type_utilisateur,
                                              nombre_utilisateurs_2_mois)
     SELECT '${semaine}',
            structure,
            type_utilisateur,
            count(distinct id_utilisateur) as nombre_utilisateurs_2_mois
     from ${analyticsTableName}
     where date_evenement between '${semaine}'::timestamp - interval '2 months' and '${semaine}'::timestamp + interval '1 week'
     group by structure, type_utilisateur
     order by structure, type_utilisateur;`
  )

  logger.log('Insertion des utilisateurs du dernier mois')
  await connexion.query(
    `insert into analytics_engagement_national(semaine,
                                      structure,
                                      type_utilisateur,
                                      nombre_utilisateurs_1_mois)
     SELECT '${semaine}',
            structure,
            type_utilisateur,
            count(distinct id_utilisateur) as nombre_utilisateurs_1_mois
     from ${analyticsTableName}
     where date_evenement between '${semaine}'::timestamp - interval '1 months' and '${semaine}'::timestamp + interval '1 week'
     group by structure, type_utilisateur
     order by structure, type_utilisateur;`
  )

  logger.log('Insertion des utilisateurs engagés')
  await connexion.query(
    `update analytics_engagement_national
     SET nombre_utilisateurs_engages_2_jours_dans_la_semaine = subquery.nombre_utilisateurs_engages_2_jours_dans_la_semaine
     FROM (SELECT count(distinct x.id_utilisateur) as nombre_utilisateurs_engages_2_jours_dans_la_semaine,
                  x.semaine,
                  x.structure,
                  x.type_utilisateur
           FROM (SELECT count(distinct jour) as nb_day_ae,
                        semaine,
                        structure,
                        type_utilisateur,
                        id_utilisateur
                 FROM ${analyticsTableName}
                 WHERE semaine = '${semaine}'
                 GROUP BY semaine, id_utilisateur, semaine, structure, type_utilisateur) x
           WHERE nb_day_ae >= 2
           GROUP BY x.semaine, x.structure, x.type_utilisateur) as subquery
     WHERE analytics_engagement_national.semaine = '${semaine}'
       AND analytics_engagement_national.structure = subquery.structure
       AND analytics_engagement_national.type_utilisateur = subquery.type_utilisateur;`
  )

  logger.log('Insertion des utilisateurs actifs 3 semaines sur 6')
  await connexion.query(
    `update analytics_engagement_national
     SET nb_actifs_3_semaines_sur_6 = subquery.nb_actifs_3_semaines_sur_6
     FROM (SELECT structure,
                  type_utilisateur,
                  count(*) as nb_actifs_3_semaines_sur_6
           FROM (SELECT count(distinct week_ae) as nb_week,
                        id_utilisateur,
                        structure,
                        type_utilisateur,
                 FROM (SELECT count(distinct jour) as nb_day_ae,
                              semaine              as week_ae,
                              structure,
                              type_utilisateur,
                              id_utilisateur
                       FROM ${analyticsTableName}
                       WHERE date_evenement between '${semaine}'::timestamp - interval '5 week' and '${semaine}'::timestamp + interval '1 week'
                       GROUP BY week_ae, id_utilisateur, structure, type_utilisateur) ee
                 WHERE nb_day_ae >= 2
                 GROUP BY id_utilisateur, structure, type_utilisateur) x
           WHERE nb_week >= 3
           GROUP BY structure, type_utilisateur,
           ORDER BY structure, type_utilisateur) as subquery
     WHERE analytics_engagement_national.semaine = '${semaine}'
       AND analytics_engagement_national.structure = subquery.structure
       AND analytics_engagement_national.type_utilisateur = subquery.type_utilisateur;`
  )

  logger.log('Insertion des utilisateurs actifs 4 semaines sur 6')
  await connexion.query(
    `update analytics_engagement_national
     SET nb_actifs_4_semaines_sur_6 = subquery.nb_actifs_4_semaines_sur_6
     FROM (SELECT structure,
                  type_utilisateur,
                  count(*) as nb_actifs_4_semaines_sur_6
           FROM (SELECT count(distinct week_ae) as nb_week,
                        id_utilisateur,
                        structure,
                        type_utilisateur
                 FROM (SELECT count(distinct jour) as nb_day_ae,
                              semaine              as week_ae,
                              structure,
                              type_utilisateur,
                              id_utilisateur
                       FROM ${analyticsTableName}
                       WHERE date_evenement between '${semaine}'::timestamp - interval '5 week' and '${semaine}'::timestamp + interval '1 week'
                       GROUP BY week_ae, id_utilisateur, structure, type_utilisateur) ee
                 WHERE nb_day_ae >= 2
                 GROUP BY id_utilisateur, structure, type_utilisateur) x
           WHERE nb_week >= 4
           GROUP BY structure, type_utilisateur
           ORDER BY structure, type_utilisateur) as subquery
     WHERE analytics_engagement_national.semaine = '${semaine}'
       AND analytics_engagement_national.structure = subquery.structure
       AND analytics_engagement_national.type_utilisateur = subquery.type_utilisateur;`
  )

  logger.log('Remplacer les null par des 0')
  await connexion.query(
    ` UPDATE analytics_engagement_national
      SET nombre_utilisateurs_1_mois = 0
      WHERE nombre_utilisateurs_1_mois IS NULL;

      UPDATE analytics_engagement_national
      SET nombre_utilisateurs_engages_2_jours_dans_la_semaine = 0
      WHERE nombre_utilisateurs_engages_2_jours_dans_la_semaine IS NULL;

      UPDATE analytics_engagement_national
      SET nb_actifs_3_semaines_sur_6 = 0
      WHERE analytics_engagement_national.nb_actifs_3_semaines_sur_6 IS NULL;

      UPDATE analytics_engagement_national
      SET nb_actifs_4_semaines_sur_6 = 0
      WHERE analytics_engagement_national.nb_actifs_4_semaines_sur_6 IS NULL;
    `
  )
}
