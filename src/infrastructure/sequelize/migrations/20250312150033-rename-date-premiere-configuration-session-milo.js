'use strict'

module.exports = {
  up: async queryInterface => {
    await queryInterface.renameColumn(
      'session_milo',
      'date_recuperation',
      'date_premiere_configuration'
    )
  },

  down: async queryInterface => {
    await queryInterface.renameColumn(
      'session_milo',
      'date_premiere_configuration',
      'date_recuperation'
    )
  }
}
