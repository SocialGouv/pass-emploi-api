'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('jeune', 'notifications_alertes_offres', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    })
    await queryInterface.addColumn('jeune', 'notifications_messages', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    })
    await queryInterface.addColumn(
      'jeune',
      'notifications_creation_action_conseiller',
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    )
    await queryInterface.addColumn(
      'jeune',
      'notifications_rendezvous_sessions',
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    )
    await queryInterface.addColumn('jeune', 'notifications_rappel_actions', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('jeune', 'notifications_alertes_offres')
    await queryInterface.removeColumn('jeune', 'notifications_messages')
    await queryInterface.removeColumn(
      'jeune',
      'notifications_creation_action_conseiller'
    )
    await queryInterface.removeColumn(
      'jeune',
      'notifications_rendezvous_sessions'
    )
    await queryInterface.removeColumn('jeune', 'notifications_rappel_actions')
  }
}
