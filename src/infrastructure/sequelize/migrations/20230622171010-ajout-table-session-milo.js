'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('session_milo', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      estVisible: {
        field: 'est_visible',
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      dateRecuperation: {
        field: 'date_recuperation',
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
        allowNull: false
      },
      dateModification: {
        field: 'date_modification',
        type: Sequelize.DATE,
        allowNull: false
      },
      idStructureMilo: {
        field: 'id_structure_milo',
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'structure_milo',
          key: 'id'
        }
      }
    })
  },

  down: async queryInterface => {
    await queryInterface.dropTable('session_milo')
  }
}
