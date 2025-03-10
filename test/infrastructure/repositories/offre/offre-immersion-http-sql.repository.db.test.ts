import { expect } from 'chai'
import { DateTime } from 'luxon'
import { Immersion } from '../../../../src/domain/offre/favori/offre-immersion'
import { FavorisOffresImmersionSqlRepository } from '../../../../src/infrastructure/repositories/offre/offre-immersion-http-sql.repository.db'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { FavoriOffreImmersionSqlModel } from '../../../../src/infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unFavoriOffreImmersion } from '../../../fixtures/offre-immersion.fixture'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { getDatabase } from '../../../utils/database-for-testing'

describe('OffresImmersionHttpSqlRepository', () => {
  let offresImmersionHttpSqlRepository: FavorisOffresImmersionSqlRepository
  const now = DateTime.now()

  beforeEach(async () => {
    await getDatabase().cleanPG()

    offresImmersionHttpSqlRepository = new FavorisOffresImmersionSqlRepository()
  })

  describe('.save', () => {
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
      await offresImmersionHttpSqlRepository.save({
        idBeneficiaire: 'ABCDE',
        offre: unFavoriOffreImmersion(),
        dateCreation: now
      })

      // Then
      const offresImmersion = await FavoriOffreImmersionSqlModel.findAll()
      expect(offresImmersion.length).to.equal(1)
      expect(offresImmersion[0].dataValues).to.deep.include({
        dateCandidature: null,
        dateCreation: now.toJSDate(),
        idJeune: 'ABCDE',
        idOffre: '123ABC',
        metier: 'Mécanicien',
        nomEtablissement: 'Mécanique du Rhône',
        secteurActivite: 'Industrie auto',
        ville: 'Lyon'
      })
    })

    it('modifie un favori', async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'ABCDE',
          idConseiller: 'ZIDANE'
        })
      )
      await offresImmersionHttpSqlRepository.save({
        idBeneficiaire: 'ABCDE',
        offre: unFavoriOffreImmersion(),
        dateCreation: now.minus({ day: 1 })
      })

      // When
      await offresImmersionHttpSqlRepository.save({
        idBeneficiaire: 'ABCDE',
        offre: unFavoriOffreImmersion(),
        dateCreation: now.minus({ day: 1 }),
        dateCandidature: now
      })

      // Then
      const offresImmersion = await FavoriOffreImmersionSqlModel.findAll()
      expect(offresImmersion.length).to.equal(1)
      expect(offresImmersion[0].dataValues).to.deep.include({
        dateCreation: now.minus({ day: 1 }).toJSDate(),
        dateCandidature: now.toJSDate(),
        idJeune: 'ABCDE',
        idOffre: '123ABC'
      })
    })
  })

  describe('.get', () => {
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
      offreImmersion = unFavoriOffreImmersion()
      await offresImmersionHttpSqlRepository.save({
        idBeneficiaire: 'ABCDE',
        offre: offreImmersion,
        dateCreation: now
      })
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
        expect(favori).to.deep.equal({
          idBeneficiaire: 'ABCDE',
          dateCreation: now,
          offre: offreImmersion
        })
      })
    })
  })

  describe('.delete', () => {
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
      offreImmersion = unFavoriOffreImmersion()
      await offresImmersionHttpSqlRepository.save({
        idBeneficiaire: 'ABCDE',
        offre: offreImmersion,
        dateCreation: now
      })

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
