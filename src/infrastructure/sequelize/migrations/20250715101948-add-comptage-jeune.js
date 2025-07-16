'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('comptage_jeune', {
      idJeune: {
        field: 'id_jeune',
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
        references: { model: 'jeune', key: 'id' }
      },
      heuresDeclarees: {
        field: 'heures_declarees',
        type: Sequelize.INTEGER,
        allowNull: false
      },
      heuresValidees: {
        field: 'heures_validees',
        type: Sequelize.INTEGER,
        allowNull: false
      },
      jourDebut: {
        field: 'jour_debut',
        type: Sequelize.STRING,
        allowNull: false
      },
      jourFin: {
        field: 'jour_fin',
        type: Sequelize.STRING,
        allowNull: false
      },
      dateMiseAJour: {
        field: 'date_mise_a_jour',
        type: Sequelize.DATE,
        allowNull: false
      }
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('comptage_jeune')
  }
}
