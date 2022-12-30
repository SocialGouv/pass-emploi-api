import { expect } from 'chai'
import { OffresImmersionHttpSqlRepository } from '../../../../src/infrastructure/repositories/offre/offre-immersion-http-sql.repository.db'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { uneOffreImmersion } from '../../../fixtures/offre-immersion.fixture'
import { FavoriOffreImmersionSqlModel } from '../../../../src/infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { Immersion } from '../../../../src/domain/offre/favori/offre-immersion'
import { getDatabase } from '../../../utils/database-for-testing'

describe('OffresImmersionHttpSqlRepository', () => {
  let offresImmersionHttpSqlRepository: OffresImmersionHttpSqlRepository

  beforeEach(async () => {
    await getDatabase().cleanPG()
    offresImmersionHttpSqlRepository = new OffresImmersionHttpSqlRepository()
  })
  describe('.saveAsFavori', () => {
    describe("quand le favori n'existe pas", () => {
      it('sauvegarde un favori', async () => {
        // Given
        await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
        await JeuneSqlModel.creer(
          unJeuneDto({
            id: 'ABCDE',
            idConseiller: 'ZIDANE'
          })
        )
        // When
        await offresImmersionHttpSqlRepository.save(
          'ABCDE',
          uneOffreImmersion()
        )

        // Then
        const offresImmersion = await FavoriOffreImmersionSqlModel.findAll()
        expect(offresImmersion.length).to.equal(1)
        expect(offresImmersion[0].idOffre).to.equal('123ABC')
        expect(offresImmersion[0].idJeune).to.equal('ABCDE')
      })
    })
  })
  describe('.getFavori', () => {
    let offreImmersion: Immersion

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'ABCDE',
          idConseiller: 'ZIDANE'
        })
      )
      offreImmersion = uneOffreImmersion()
      await offresImmersionHttpSqlRepository.save('ABCDE', offreImmersion)
    })

    describe("quand le favori n'existe pas", () => {
      it('renvoie undefined', async () => {
        // When
        const favori = await offresImmersionHttpSqlRepository.get(
          'ABCDE',
          'UN MAUVAIS ID'
        )
        // Then
        expect(favori).to.equal(undefined)
      })
    })

    describe('quand le favori existe', () => {
      it("renvoie l'offre d'emploi", async () => {
        // When
        const favori = await offresImmersionHttpSqlRepository.get(
          'ABCDE',
          offreImmersion.id
        )
        // Then
        expect(favori).to.deep.equal(offreImmersion)
      })
    })
  })
  describe('.deleteFavori', () => {
    let offreImmersion: Immersion

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'ABCDE',
          idConseiller: 'ZIDANE'
        })
      )
    })

    it('supprime le favori', async () => {
      // Given
      offreImmersion = uneOffreImmersion()
      await offresImmersionHttpSqlRepository.save('ABCDE', offreImmersion)
      // When
      await offresImmersionHttpSqlRepository.delete('ABCDE', offreImmersion.id)
      // Then
      const actual = await offresImmersionHttpSqlRepository.get(
        'ABCDE',
        offreImmersion.id
      )
      expect(actual).to.equal(undefined)
    })
  })
})
