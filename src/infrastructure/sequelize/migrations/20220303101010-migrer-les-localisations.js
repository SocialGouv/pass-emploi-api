'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
      const immersionsSql = await queryInterface.sequelize.query(
        `SELECT *
         from recherche
         where type = 'OFFRES_IMMERSION';`,
        { transaction }
      )

      for (const immersionSql of immersionsSql[0]) {
        if (immersionSql.criteres.lon && immersionSql.criteres.lat) {
          const center = {
            type: 'Point',
            coordinates: [immersionSql.criteres.lon, immersionSql.criteres.lat]
          }
          const distance = immersionSql.criteres.distance
            ? immersionSql.criteres.distance
            : 10
          await queryInterface.sequelize.query(
            `UPDATE recherche
             SET geometrie = (
                 ST_Buffer(ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(
                   center
                 )}')::geography, 4326), ${distance * 1000})::geometry)
             WHERE recherche.id = '${immersionSql.id}'
            ;`,
            { transaction }
          )
        }
      }

      const offresSql = await queryInterface.sequelize.query(
        `SELECT *
         from recherche
         where type = 'OFFRES_EMPLOI'
            OR type = 'OFFRES_ALTERNANCE';`,
        { transaction }
      )

      for (const offreSql of offresSql[0]) {
        if (offreSql.criteres.commune) {
          const commune = await queryInterface.sequelize.query(
            `SELECT latitude, longitude
             from commune
             where code = '${offreSql.criteres.commune}';`,
            { transaction }
          )

          if (commune?.length) {
            const center = {
              type: 'Point',
              coordinates: [commune[0].longitude, commune[0].latitude]
            }
            const distance = offreSql.criteres.distance
              ? offreSql.criteres.distance
              : 10
            await queryInterface.sequelize.query(
              `UPDATE recherche
             SET geometrie = (
                 ST_Buffer(ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(
                   center
                 )}')::geography, 4326), ${distance * 1000})::geometry)
             WHERE recherche.id = '${offreSql.id}'
            ;`,
              { transaction }
            )
          }
        }
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `UPDATE recherche
       SET geometrie = null
       WHERE geometrie is not null;`
    )
  }
}
