'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `delete from rendez_vous
       where date_suppression IS NOT NULL`,
        {
          transaction
        }
      )
      await queryInterface.removeColumn('rendez_vous', 'date_suppression', {
        transaction
      })
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('rendez_vous', 'date_suppression', {
      type: Sequelize.DATE,
      allowNull: true
    })
  }
}
