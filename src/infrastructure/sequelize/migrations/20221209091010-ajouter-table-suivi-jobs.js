'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('suivi_jobs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      jobType: {
        field: 'job_type',
        type: Sequelize.STRING,
        allowNull: false
      },
      dateExecution: {
        field: 'date_execution',
        type: Sequelize.DATE,
        allowNull: false
      },
      succes: {
        field: 'succes',
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      resultat: {
        field: 'resultat',
        type: Sequelize.JSONB,
        allowNull: false
      },
      nbErreurs: {
        field: 'nb_erreurs',
        type: Sequelize.INTEGER,
        allowNull: false
      },
      tempsExecution: {
        field: 'temps_execution',
        type: Sequelize.INTEGER,
        allowNull: false
      }
    })
  },

  down: async queryInterface => {
    await queryInterface.dropTable('suivi_jobs')
  }
}
