'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `ALTER SEQUENCE evenement_engagement_id_seq OWNED BY evenement_engagement_hebdo.id`,
        { transaction }
      )
      await queryInterface.dropTable('evenement_engagement', { transaction })
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.createTable(
        'evenement_engagement',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          dateEvenement: {
            field: 'date_evenement',
            type: Sequelize.DATE,
            allowNull: false
          },
          categorie: {
            field: 'categorie',
            type: Sequelize.STRING,
            allowNull: true
          },
          action: {
            field: 'action',
            type: Sequelize.STRING,
            allowNull: true
          },
          nom: {
            field: 'nom',
            type: Sequelize.STRING,
            allowNull: true
          },
          idUtilisateur: {
            field: 'id_utilisateur',
            type: Sequelize.STRING,
            allowNull: false
          },
          typeUtilisateur: {
            field: 'type_utilisateur',
            type: Sequelize.STRING,
            allowNull: false
          },
          structure: {
            field: 'structure',
            type: Sequelize.STRING,
            allowNull: true
          },
          code: {
            field: 'code',
            type: Sequelize.STRING,
            allowNull: false
          }
        },
        { transaction }
      )
      await queryInterface.removeConstraint(
        'evenement_engagement',
        'evenement_engagement_pkey',
        { transaction }
      )
      await queryInterface.removeIndex(
        'evenement_engagement',
        'evenement_engagement_pkey',
        { transaction }
      )
    })
  }
}
