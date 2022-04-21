'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
          'conseiller',
          'nom_manuel_agence',
          {
            type: Sequelize.STRING,
            allowNull: true
          },
          {transaction}
      )
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('conseiller', 'nom_manuel_agence', {
        transaction
      })
    })
  }
};
