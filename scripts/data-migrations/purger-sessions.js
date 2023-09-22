require('dotenv').config()
const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres'
})

sequelize.transaction(async transaction => {
  for (jeune of jeunesEarlyAdopters) {
    await sequelize.query(
      `DELETE FROM rendez_vous WHERE rendez_vous.type = 'SESSION_MILO'`,
      {
        transaction
      }
    )
  }
})
