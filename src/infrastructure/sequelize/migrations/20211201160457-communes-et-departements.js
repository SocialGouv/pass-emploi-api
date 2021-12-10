'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction({isolationLevel: Sequelize.Transaction.SERIALIZABLE}, async (transaction) => {
      await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm";')
      await queryInterface.createTable('departement', {
        code: {
          primaryKey: true,
          type: Sequelize.STRING,
          allowNull: false
        },
        libelle: {
          type: Sequelize.STRING,
          allowNull: false
        }
      }, {transaction})
      await queryInterface.createTable('commune', {
        id: {
          type: Sequelize.STRING,
          primaryKey: true,
          allowNull: false
        },
        code: {
          type: Sequelize.STRING,
          allowNull: false
        },
        libelle: {
          type: Sequelize.STRING,
          allowNull: false
        },
        codePostal: {
          field: 'code_postal',
          type: Sequelize.STRING,
          allowNull: false
        },
        codeDepartement: {
          field: 'code_departement',
          type: Sequelize.STRING,
          allowNull: false
        }
      }, {transaction})
      await queryInterface.addIndex('departement', ['libelle'], {transaction, using: 'GIN', operator: 'gin_trgm_ops'})
      await queryInterface.addIndex('commune', ['libelle'], {transaction, using: 'GIN', operator: 'gin_trgm_ops'})
    })

  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction({isolationLevel: Sequelize.Transaction.SERIALIZABLE}, async (transaction) => {
      await queryInterface.dropTable('departement', {transaction})
      await queryInterface.dropTable('commune', {transaction})
      await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS "pg_trgm";')
    })
  }
};
