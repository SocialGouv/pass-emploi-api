'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      for (const { code, categorie, action, nom } of evenements) {
        if (nom) {
          await queryInterface.sequelize.query(
            `UPDATE evenement_engagement
             SET code = '${code}'
             WHERE categorie = '${categorie}'
               AND action = '${action}'
               AND nom = '${nom}' AND code IS NULL`,
            { transaction }
          )
        } else {
          await queryInterface.sequelize.query(
            `UPDATE evenement_engagement
             SET code = '${code}'
             WHERE categorie = '${categorie}'
               AND action = '${action}'
               and nom is null AND code IS NULL`,
            { transaction }
          )
        }
      }

      await queryInterface.sequelize.query(
        `UPDATE evenement_engagement
         SET code = 'INCONNU'
         WHERE code is null`,
        { transaction }
      )

      await queryInterface.changeColumn(
        'evenement_engagement',
        'code',
        {
          type: Sequelize.STRING,
          allowNull: false
        },
        { transaction }
      )
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.changeColumn(
        'evenement_engagement',
        'code',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.sequelize.query(
        `UPDATE evenement_engagement
         SET code = null
         WHERE true`,
        { transaction }
      )
    })
  }
}

const evenements = [
  { code: 'ACTION_CREE', categorie: 'Action', action: 'Création' },
  { code: 'ACTION_CREE', categorie: 'Demarche', action: 'Création' },
  {
    code: 'ACTION_DETAIL',
    categorie: 'Action',
    action: 'Consultation',
    nom: 'Détail'
  },
  {
    code: 'ACTION_LISTE',
    categorie: 'Action',
    action: 'Consultation',
    nom: 'Liste'
  },
  {
    code: 'ACTION_STATUT_MODIFIE',
    categorie: 'Action',
    action: 'Modification',
    nom: 'Statut'
  },
  {
    code: 'ACTION_COMMENTEE',
    categorie: 'Commentaire Action',
    action: 'Création'
  },
  {
    code: 'ACTION_STATUT_MODIFIE',
    categorie: 'Demarche',
    action: 'Modification'
  },
  {
    code: 'ACTION_STATUT_MODIFIE',
    categorie: 'Action',
    action: 'Modification'
  },
  {
    code: 'ACTION_SUPPRIMEE',
    categorie: 'Action',
    action: 'Suppression'
  },
  {
    code: 'ACTION_COMMENTEE',
    categorie: 'Action',
    action: 'Commentaire',
    nom: 'Ajout'
  },
  {
    code: 'ACTION_QUALIFIEE_SNP',
    categorie: 'Action',
    action: 'Qualifier',
    nom: 'SNP'
  },
  {
    code: 'ACTION_QUALIFIEE_NON_SNP',
    categorie: 'Action',
    action: 'Qualifier',
    nom: 'Non SNP'
  },
  {
    code: 'COMPTE_SUPPRIME',
    categorie: 'Compte',
    action: 'Suppression'
  },
  {
    code: 'COMPTE_ARCHIVE',
    categorie: 'Compte',
    action: 'Archivage'
  },
  {
    code: 'OFFRE_EMPLOI_AFFICHEE',
    categorie: 'Offre',
    action: 'Détail',
    nom: 'Emploi'
  },
  {
    code: 'OFFRE_EMPLOI_RECHERCHEE',
    categorie: 'Offre',
    action: 'Recherche',
    nom: 'Emploi'
  },
  {
    code: 'OFFRE_EMPLOI_SAUVEGARDEE',
    categorie: 'Offre',
    action: 'Favori',
    nom: 'Emploi'
  },
  {
    code: 'OFFRE_EMPLOI_POSTULEE',
    categorie: 'Offre',
    action: 'Postuler',
    nom: 'Emploi'
  },
  {
    code: 'OFFRE_EMPLOI_PARTAGEE',
    categorie: 'Offre',
    action: 'Partage',
    nom: 'Emploi'
  },
  {
    code: 'OFFRE_IMMERSION_AFFICHEE',
    categorie: 'Offre',
    action: 'Détail',
    nom: 'Immersion'
  },
  {
    code: 'OFFRE_IMMERSION_RECHERCHEE',
    categorie: 'Offre',
    action: 'Recherche',
    nom: 'Immersion'
  },
  {
    code: 'OFFRE_IMMERSION_SAUVEGARDEE',
    categorie: 'Offre',
    action: 'Favori',
    nom: 'Immersion'
  },
  {
    code: 'OFFRE_IMMERSION_APPEL',
    categorie: 'Offre',
    action: 'Appel',
    nom: 'Immersion'
  },
  {
    code: 'OFFRE_IMMERSION_ENVOI_EMAIL',
    categorie: 'Offre',
    action: 'Envoi email',
    nom: 'Immersion'
  },
  {
    code: 'OFFRE_IMMERSION_LOCALISATION',
    categorie: 'Offre',
    action: 'Localiser',
    nom: 'Immersion'
  },
  {
    code: 'OFFRE_ALTERNANCE_AFFICHEE',
    categorie: 'Offre',
    action: 'Détail',
    nom: 'Alternance'
  },
  {
    code: 'OFFRE_ALTERNANCE_RECHERCHEE',
    categorie: 'Offre',
    action: 'Recherche',
    nom: 'Alternance'
  },
  {
    code: 'OFFRE_ALTERNANCE_SAUVEGARDEE',
    categorie: 'Offre',
    action: 'Favori',
    nom: 'Alternance'
  },
  {
    code: 'OFFRE_ALTERNANCE_POSTULEE',
    categorie: 'Offre',
    action: 'Postuler',
    nom: 'Alternance'
  },
  {
    code: 'OFFRE_ALTERNANCE_PARTAGEE',
    categorie: 'Offre',
    action: 'Partage',
    nom: 'Alternance'
  },
  {
    code: 'OFFRE_PARTAGEE',
    categorie: 'Offre',
    action: 'Partager'
  },
  {
    code: 'OFFRE_POSTULEE',
    categorie: 'Offre',
    action: 'Postuler'
  },
  { code: 'MESSAGE_ENVOYE', categorie: 'Message', action: 'Envoi' },
  {
    code: 'MESSAGE_ENVOYE_MULTIPLE',
    categorie: 'Message',
    action: 'Envoi multiple'
  },
  {
    code: 'MESSAGE_ENVOYE_MULTIPLE_PJ',
    categorie: 'Message',
    action: 'Envoi multiple PJ'
  },
  {
    code: 'MESSAGE_ENVOYE_PJ',
    categorie: 'Message',
    action: 'Envoi PJ'
  },
  {
    code: 'MESSAGE_OFFRE_PARTAGEE',
    categorie: 'Message',
    action: 'Partager',
    nom: 'Offre'
  },
  { code: 'RDV_CREE', categorie: 'Rendez-vous', action: 'Création' },
  {
    code: 'RDV_MODIFIE',
    categorie: 'Rendez-vous',
    action: 'Modification'
  },
  {
    code: 'RDV_SUPPRIME',
    categorie: 'Rendez-vous',
    action: 'Suppression'
  },
  {
    code: 'RECHERCHE_OFFRE_EMPLOI_SAUVEGARDEE',
    categorie: 'Recherche',
    action: 'Enregistrer',
    nom: 'Emploi'
  },
  {
    code: 'RECHERCHE_ALTERNANCE_SAUVEGARDEE',
    categorie: 'Recherche',
    action: 'Enregistrer',
    nom: 'Alternance'
  },
  {
    code: 'RECHERCHE_IMMERSION_SAUVEGARDEE',
    categorie: 'Recherche',
    action: 'Enregistrer',
    nom: 'Immersion'
  },
  {
    code: 'SERVICE_CIVIQUE_RECHERCHE',
    categorie: 'Offre',
    action: 'Recherche',
    nom: 'Service Civique'
  },
  {
    code: 'OFFRE_SERVICE_CIVIQUE_AFFICHE',
    categorie: 'Offre',
    action: 'Détail',
    nom: 'Service Civique'
  },
  {
    code: 'OFFRE_SERVICE_CIVIQUE_POSTULEE',
    categorie: 'Offre',
    action: 'Postuler',
    nom: 'Service Civique'
  },
  {
    code: 'OFFRE_SERVICE_CIVIQUE_PARTAGEE',
    categorie: 'Offre',
    action: 'Partager',
    nom: 'Service Civique'
  },
  {
    code: 'OFFRE_SERVICE_CIVIQUE_SAUVEGARDEE',
    categorie: 'Offre',
    action: 'Favori',
    nom: 'Service Civique'
  },
  {
    code: 'RECHERCHE_SERVICE_CIVIQUE_SAUVEGARDEE',
    categorie: 'Recherche',
    action: 'Enregistrer',
    nom: 'Service Civique'
  },
  {
    code: 'RDV_LISTE',
    categorie: 'Rendez-vous',
    action: 'Consultation',
    nom: 'Liste'
  },
  {
    code: 'RDV_DETAIL',
    categorie: 'Rendez-vous',
    action: 'Consultation',
    nom: 'Détail'
  },
  {
    code: 'PIECE_JOINTE_TELECHARGEE',
    categorie: 'Message',
    action: 'Téléchargement PJ'
  },
  {
    code: 'PREFERENCES_MISES_A_JOUR',
    categorie: 'Préférences',
    action: 'Mise à jour'
  }
]
