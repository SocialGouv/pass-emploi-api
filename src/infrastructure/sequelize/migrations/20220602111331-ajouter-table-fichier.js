'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('fichier', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      idsJeunes: {
        field: 'ids_jeunes',
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false
      },
      mimeType: {
        field: 'mime_type',
        type: Sequelize.STRING,
        allowNull: false
      },
      nom: {
        field: 'nom',
        type: Sequelize.STRING,
        allowNull: false
      },
      dateCreation: {
        field: 'date_creation',
        type: Sequelize.DATE,
        allowNull: false
      }
    })
  },

  down: async queryInterface => {
    await queryInterface.dropTable('fichier')
  }
}
