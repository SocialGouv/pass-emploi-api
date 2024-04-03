require('dotenv').config()
const { Sequelize } = require('sequelize')

await updateEvenementEngagementHebdo()
await updateEvenementEngagementAnalytics()

async function updateEvenementEngagementHebdo() {
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres'
  })

  await sequelize.query(
    `UPDATE evenement_engagement_hebdo
     SET action = 'Ouverture PJ conseiller'
     WHERE action = 'Ouverture PJ'`
  )
}

async function updateEvenementEngagementAnalytics() {
  const sequelize = new Sequelize(process.env.DUMP_RESTORE_DB_TARGET, {
    dialect: 'postgres'
  })

  await sequelize.query(
    `UPDATE evenement_engagement
     SET action = 'Ouverture PJ conseiller'
     WHERE action = 'Ouverture PJ'`
  )
}
