'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'jeune',
        'date_premiere_connexion',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        {transaction}
      )
      await queryInterface.addColumn(
        'jeune',
        'date_derniere_connexion',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        {transaction}
      )
      await queryInterface.addColumn(
        'conseiller',
        'date_derniere_connexion',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        {transaction}
      )
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('jeune', 'date_premiere_connexion', {transaction})
      await queryInterface.removeColumn('jeune', 'date_derniere_connexion', {transaction})
      await queryInterface.removeColumn('conseiller', 'date_derniere_connexion', {transaction})
    })
  }
};
