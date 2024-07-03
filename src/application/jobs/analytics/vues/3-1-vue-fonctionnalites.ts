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
    SELECT table_nom.semaine,
           table_nom.structure,
           table_nom.type_utilisateur,
           table_nom.categorie,
           table_nom.action,
           table_nom.nom,
           MIN(nb_ae_categorie)    as nb_ae_categorie,
           MIN(nb_users_categorie) as nb_users_categorie,
           MIN(nb_ae_action)       as nb_ae_action,
           MIN(nb_users_action)    as nb_users_action,
           MIN(nb_ae_nom)          as nb_ae_nom,
           MIN(nb_users_nom)       as nb_users_nom,
           MIN(nb_ae)              as nb_ae_total,
           MIN(nb_users_tot)       as nb_users_total
    FROM (SELECT COUNT(distinct id_utilisateur) as nb_users_nom,
                 count(*)                       as nb_ae_nom,
                 semaine,
                 categorie,
                 action,
                 nom,
                 structure,
                 type_utilisateur
          FROM evenement_engagement
          where structure is not null
            and structure != 'PASS_EMPLOI'
            and semaine = '${semaine}'
          GROUP BY semaine, structure, categorie, action, nom, type_utilisateur) as table_nom
           INNER JOIN (SELECT COUNT(distinct id_utilisateur) as nb_users_action,
                              count(*)                       as nb_ae_action,
                              semaine,
                              type_utilisateur,
                              structure,
                              categorie,
                              action
                       FROM evenement_engagement
                       where structure is not null
                         and structure != 'PASS_EMPLOI'
                         and semaine = '${semaine}'
                       GROUP BY semaine, structure, categorie, action, type_utilisateur) as table_action
                      ON table_nom.semaine = table_action.semaine and
                         table_nom.structure = table_action.structure and
                         table_nom.type_utilisateur = table_action.type_utilisateur and
                         table_nom.categorie = table_action.categorie and
                         table_nom.action = table_action.action
           INNER JOIN (SELECT COUNT(distinct id_utilisateur) as nb_users_categorie,
                              count(*)                       as nb_ae_categorie,
                              semaine,
                              structure,
                              type_utilisateur,
                              categorie
                       FROM evenement_engagement
                       where structure is not null
                         and structure != 'PASS_EMPLOI'
                         and semaine = '${semaine}'
                       GROUP BY semaine, structure, categorie, type_utilisateur) as table_cat
                      ON table_nom.semaine = table_cat.semaine and
                         table_nom.structure = table_cat.structure and
                         table_nom.type_utilisateur = table_cat.type_utilisateur and
                         table_nom.categorie = table_cat.categorie
           INNER JOIN (SELECT count(*)                       as nb_ae,
                              COUNT(distinct id_utilisateur) as nb_users_tot,
                              semaine,
                              structure,
                              type_utilisateur
                       FROM evenement_engagement
                       where structure is not null
                         and structure != 'PASS_EMPLOI'
                         and semaine = '${semaine}'
                       GROUP BY semaine, structure, type_utilisateur) as table_tot
                      ON table_nom.semaine = table_tot.semaine and
                         table_nom.structure = table_tot.structure and
                         table_nom.type_utilisateur = table_tot.type_utilisateur
    GROUP BY table_nom.semaine, table_nom.structure, table_nom.categorie, table_nom.action, table_nom.nom,
             table_nom.type_utilisateur
    ORDER BY table_nom.structure, table_nom.type_utilisateur, table_nom.categorie, table_nom.action, table_nom.nom;
  `)
}
