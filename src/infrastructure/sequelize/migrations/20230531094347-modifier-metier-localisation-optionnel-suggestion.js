'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `ALTER TABLE suggestion ALTER COLUMN metier DROP NOT NULL;
        ALTER TABLE suggestion ALTER COLUMN localisation DROP NOT NULL;`,
        { transaction }
      )
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `ALTER TABLE suggestion ALTER COLUMN metier SET NOT NULL;
        ALTER TABLE suggestion ALTER COLUMN localisation SET NOT NULL;`,
        { transaction }
      )
    })
  }
}
