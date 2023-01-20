const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '/../../.environment') })

const { Sequelize } = require('sequelize')
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  pool: {
    max: 20,
    min: 0,
    acquire: 15000000,
    idle: 10000
  }
})

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

let bufferUpdate = []
const bufferSize = 1

lineReader.on('line', function (line) {
  const { _source } = JSON.parse(line)
  const timezone = timezoneOffsetMap[_source.msg.req.query.maintenant.slice(-6)]

  bufferUpdate.push({ id: _source.msg.event.utilisateur.id, timezone })
  if (bufferUpdate.length >= bufferSize) {
    const updateSqlString = fromBufferToSqlValues(bufferUpdate)
    sequelize.query(`
        UPDATE jeune
        SET timezone = jeune_updated.timezone
            FROM (
                VALUES ${updateSqlString}
            ) AS jeune_updated(id,timezone)
        WHERE jeune.id = jeune_updated.id AND jeune.timezone IS NULL;
    `)
    bufferUpdate = []
  }
})

lineReader.on('close', async function () {
  viderBuffer(bufferUpdate)
})

function viderBuffer(buffer) {
  if (buffer.length > 0) {
    const updateSqlString = fromBufferToSqlValues(bufferUpdate)
    sequelize.query(`
            UPDATE jeune
            SET timezone = jeune_updated.timezone
            FROM (
                VALUES ${updateSqlString}
            ) AS jeune_updated(id,timezone)
            WHERE jeune.id = jeune_updated.id;
        `)
  }
}

function fromBufferToSqlValues(buffer) {
  return buffer
    .map(({ id, timezone }) => {
      return `('${id}', '${timezone}')`
    })
    .join(',')
}
