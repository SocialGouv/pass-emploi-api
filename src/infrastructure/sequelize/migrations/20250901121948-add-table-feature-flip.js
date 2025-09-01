'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('feature_flip', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      feature_tag: {
        type: Sequelize.STRING,
        allowNull: false
      }
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('feature_flip')
  }
}
