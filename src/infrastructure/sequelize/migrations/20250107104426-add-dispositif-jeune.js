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
        `UPDATE jeune SET dispositif = 'CEJ' WHERE structure = 'MILO' OR structure = 'POLE_EMPLOI' OR structure = 'PASS_EMPLOI' OR structure = 'SUPPORT'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
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
        `UPDATE jeune SET dispositif = 'Conseil Départemental' WHERE structure = 'CONSEIL_DEPT'`,
        {
          type: Sequelize.QueryTypes.UPDATE,
          transaction
        }
      )
      await queryInterface.sequelize.query(
        `UPDATE jeune SET dispositif = 'Avenir Pro' WHERE structure = 'AVENIR_PRO'`,
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
