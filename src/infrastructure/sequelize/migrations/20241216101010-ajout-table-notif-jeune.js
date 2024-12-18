'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notification_jeune', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      id_jeune: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'jeune',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      date_notif: {
        field: 'date_notif',
        type: Sequelize.DATE,
        allowNull: false
      },
      type: {
        field: 'type',
        type: Sequelize.STRING,
        allowNull: false
      },
      titre: {
        field: 'titre',
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        field: 'description',
        type: Sequelize.STRING(1024),
        allowNull: false
      },
      idObjet: {
        field: 'id_objet',
        type: Sequelize.STRING,
        allowNull: true
      }
    })
  },

  down: async queryInterface => {
    await queryInterface.dropTable('notification_jeune')
  }
}
