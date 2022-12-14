const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '/../../.environment') })

const { Sequelize } = require('sequelize')
const sequelize = new Sequelize(process.env.DATABASE_URL)

const lineReader = require('readline').createInterface({
  input: require('fs').createReadStream(
    './data-migrations/logs-elastic-offset.json'
  )
})

const timezoneOffsetMap = {
  '+01:00': 'Europe/Paris',
  '-04:00': 'America/Guadeloupe', // idem America/Martinique, décision arbitraire
  '-03:00': 'America/Cayenne',
  '+04:00': 'Indian/Reunion',
  '+03:00': 'Indian/Mayotte'
}

lineReader.on('line', async function (line) {
  const { _source } = JSON.parse(line)
  const timezone = timezoneOffsetMap[_source.msg.req.query.maintenant.slice(-6)]

  if (timezone && timezone !== 'Europe/Paris') {
    await sequelize.query(`UPDATE jeune SET timezone = ? WHERE id = ?`, {
      replacements: [timezone, _source.msg.event.utilisateur.id]
    })
  }
})
