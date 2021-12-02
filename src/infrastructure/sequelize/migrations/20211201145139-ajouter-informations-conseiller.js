'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('conseiller', 'email', {
        type: Sequelize.STRING
      }, {transaction})
      await queryInterface.addColumn('conseiller', 'structure', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'PASS_EMPLOI'
      }, {transaction})
      await queryInterface.addColumn('conseiller', 'id_authentification', {
        type: Sequelize.STRING
      }, {transaction})
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('conseiller', 'email', { transaction })
      await queryInterface.removeColumn('conseiller', 'structure', { transaction })
      await queryInterface.removeColumn('conseiller', 'id_authentification', { transaction })
    })
  }
};
