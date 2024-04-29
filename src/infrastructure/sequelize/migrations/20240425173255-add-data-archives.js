'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('archive_jeune', 'id_structure_milo', {
      type: Sequelize.STRING,
      allowNull: true
    })
    await queryInterface.addColumn('archive_jeune', 'id_partenaire', {
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('fichier', 'id_structure_milo')
    await queryInterface.removeColumn('fichier', 'id_partenaire')
  }
}
