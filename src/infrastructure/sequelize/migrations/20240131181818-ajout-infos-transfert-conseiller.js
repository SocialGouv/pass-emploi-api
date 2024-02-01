'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('transfert_conseiller', 'email_jeune', {
      type: Sequelize.STRING,
      allowNull: true
    })
    await queryInterface.addColumn(
      'transfert_conseiller',
      'id_conseiller_qui_transfert',
      {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'conseiller',
          key: 'id'
        }
      }
    )
    await queryInterface.addColumn('transfert_conseiller', 'type_transfert', {
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('transfert_conseiller', 'email_jeune')
    await queryInterface.removeColumn(
      'transfert_conseiller',
      'id_conseiller_qui_transfert'
    )
    await queryInterface.removeColumn('transfert_conseiller', 'type_transfert')
  }
}
