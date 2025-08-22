'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('feedback', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      idUtilisateur: {
        field: 'id_utilisateur',
        type: Sequelize.STRING,
        allowNull: true
      },
      structure: {
        field: 'structure',
        type: Sequelize.STRING,
        allowNull: false
      },
      tag: {
        field: 'tag',
        type: Sequelize.STRING,
        allowNull: false
      },
      note: {
        field: 'note',
        type: Sequelize.INTEGER,
        allowNull: false
      },
      commentaire: {
        field: 'commentaire',
        type: Sequelize.STRING(255),
        allowNull: true
      },
      dateCreation: {
        field: 'date_creation',
        type: Sequelize.DATE,
        allowNull: false
      }
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('feedback')
  }
}
