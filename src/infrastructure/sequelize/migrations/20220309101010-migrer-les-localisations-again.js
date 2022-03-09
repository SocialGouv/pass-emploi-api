'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async transaction => {
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
          
          if (commune?.length && commune[0].length) {
            const center = {
              type: 'Point',
              coordinates: [commune[0][0].longitude, commune[0][0].latitude]
            }
            const distance = offreSql.criteres.rayon
              ? offreSql.criteres.rayon
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
       WHERE type = 'OFFRES_EMPLOI' OR type = 'OFFRES_ALTERNANCE';`
    )
  }
}
