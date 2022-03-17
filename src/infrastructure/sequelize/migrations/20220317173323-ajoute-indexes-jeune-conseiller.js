'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addIndex('jeune', ['id_authentification'], {
        transaction,
        name: 'idx_jeune_id_authentification'
      })
      await queryInterface.addIndex('jeune', ['email'], {
        transaction,
        name: 'idx_jeune_email'
      })
      await queryInterface.addIndex('conseiller', ['id_authentification'], {
        transaction,
        name: 'idx_conseiller_id_authentification'
      })
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeIndex('jeune', 'idx_jeune_id_authentification', {transaction})
      await queryInterface.removeIndex('jeune', 'idx_jeune_email', {transaction})
      await queryInterface.removeIndex('conseiller', 'idx_conseiller_id_authentification', {transaction})
    })
  }
};
