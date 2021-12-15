module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(
      { isolationLevel: Sequelize.Transaction.SERIALIZABLE },
      async transaction => {
        await queryInterface.addColumn(
          'commune',
          'longitude',
          { type: Sequelize.DECIMAL(9, 6) },
          { transaction }
        )
        await queryInterface.addColumn(
          'commune',
          'latitude',
          { type: Sequelize.DECIMAL(8, 6) },
          { transaction }
        )
      }
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(
      { isolationLevel: Sequelize.Transaction.SERIALIZABLE },
      async transaction => {
        await queryInterface.removeColumn('commune', 'longitude', {
          transaction
        })
        await queryInterface.removeColumn('commune', 'latitude', {
          transaction
        })
      }
    )
  }
}
