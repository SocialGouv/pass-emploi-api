'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('archivage_jeune', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      email: {
        field: 'email',
        type: Sequelize.STRING,
        allowNull: false
      },
      dateArchivage: {
        field: 'date_archivage',
        type: Sequelize.DATE,
        allowNull: false
      },
      donnees: {
        field: 'donnees',
        type: Sequelize.JSONB,
        allowNull: false
      }
    })
  },

  down: async queryInterface => {
    await queryInterface.dropTable('archivage_jeune')
  }
}
