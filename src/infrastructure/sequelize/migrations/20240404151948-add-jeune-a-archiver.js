'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jeune_milo_a_archiver', {
      idJeune: {
        field: 'id_jeune',
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
        references: { model: 'jeune', key: 'id' }
      }
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('jeune_milo_a_archiver')
  }
}
