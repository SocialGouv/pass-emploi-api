module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(
      { isolationLevel: Sequelize.Transaction.SERIALIZABLE },
      async transaction => {
        const jeunes = await queryInterface.sequelize.query(
          `SELECT id, email FROM jeune WHERE email IS NOT NULL`,
          { type: Sequelize.QueryTypes.SELECT, transaction }
        )
        for (const { id, email } of jeunes) {
          await queryInterface.sequelize.query(
            `UPDATE jeune SET email = :lowerCaseEmail WHERE id = :id`,
            {
              type: Sequelize.QueryTypes.UPDATE,
              replacements: { id, lowerCaseEmail: email.toLowerCase() },
              transaction
            }
          )
        }
      }
    )
  },

  async down() {}
}
