'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn(
        'jeune',
        'dispositif',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      )
      await queryInterface.sequelize.query(
        `UPDATE jeune SET dispositif = 'BRSA' WHERE structure = 'POLE_EMPLOI_BRSA'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `UPDATE jeune SET dispositif = 'AIJ' WHERE structure = 'POLE_EMPLOI_AIJ'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `UPDATE jeune SET dispositif = 'CONSEIL_DEPT' WHERE structure = 'CONSEIL_DEPT'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `UPDATE jeune SET dispositif = 'AVENIR_PRO' WHERE structure = 'AVENIR_PRO'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `UPDATE jeune SET dispositif = 'CEJ' WHERE dispositif IS NULL`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.changeColumn(
        'jeune',
        'dispositif',
        {
          type: Sequelize.STRING,
          allowNull: false
        },
        { transaction }
      )
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('jeune', 'dispositif')
  }
}
