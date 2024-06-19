'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate('conseiller', {
      notifications_sonores: true
    })

    await queryInterface.changeColumn('conseiller', 'notifications_sonores', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('conseiller', 'notifications_sonores', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    })
  }
}
