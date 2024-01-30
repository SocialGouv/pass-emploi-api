require('dotenv').config()
const { Sequelize } = require('sequelize')
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres'
})

sequelize.transaction(async transaction => {
  const doublonsArchivesRaw = await sequelize.query(
    `SELECT a.*
    FROM archive_jeune a
    JOIN (SELECT id_jeune, COUNT(*)
    FROM archive_jeune 
    GROUP BY id_jeune
    HAVING count(*) > 1 ) b
    ON a.id_jeune = b.id_jeune
    ORDER BY a.id_jeune`,
    {
      transaction
    }
  )

  const doublonsArchives = doublonsArchivesRaw[0]
  let deletedIdJeune = 'aucun'

  for (const doublonArchive of doublonsArchives) {
    if (doublonArchive.id_jeune !== deletedIdJeune) {
      await sequelize.query(
        `DELETE FROM archive_jeune WHERE id_jeune = ? AND id != ?`,
        {
          replacements: [doublonArchive.id_jeune, doublonArchive.id],
          transaction
        }
      )
      deletedIdJeune = doublonArchive.id_jeune
    }
  }
})
