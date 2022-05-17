import { DatabaseForTesting, expect } from '../../utils'
import { CampagneSqlRepository } from '../../../src/infrastructure/repositories/campagne-sql.repository'
import { uneCampagne } from '../../fixtures/campagne.fixture'
import { CampagneSqlModel } from '../../../src/infrastructure/sequelize/models/campagne.sql-model'
import { DateTime } from 'luxon'

describe('CampagneSqlRepository', () => {
  DatabaseForTesting.prepare()

  let campagneSqlRepository: CampagneSqlRepository

  beforeEach(() => {
    campagneSqlRepository = new CampagneSqlRepository()
  })

  describe('save', () => {
    it('sauvegarde une campagne', async () => {
      // Given
      const campagne = uneCampagne()

      // When
      await campagneSqlRepository.save(campagne)

      // Then
      const campagnesSql = await CampagneSqlModel.findAll()
      expect(campagnesSql).to.have.length(1)
      expect(campagnesSql[0].id).to.equal(campagne.id)
      expect(campagnesSql[0].nom).to.equal(campagne.nom)
      expect(
        DateTime.fromJSDate(campagnesSql[0].dateFin).toUTC()
      ).to.deep.equal(campagne.dateFin.toUTC())
      expect(
        DateTime.fromJSDate(campagnesSql[0].dateDebut).toUTC()
      ).to.deep.equal(campagne.dateDebut.toUTC())
    })
  })

  describe('getByInterval', () => {
    it("retourne une campagne quand elle est à cheval sur l'intervalle", async () => {
      // Given
      const campagne = uneCampagne()
      await campagneSqlRepository.save(campagne)
      const dateDebutUnJourApres = campagne.dateDebut.plus({ day: 1 })
      const dateFInUnJourApres = campagne.dateFin.plus({ day: 1 })

      // When
      const campagneCherchee = await campagneSqlRepository.getByIntervalOrName(
        dateDebutUnJourApres,
        dateFInUnJourApres,
        'nom'
      )
      // Then
      expect(campagneCherchee).to.deep.equal(campagne)
    })

    it('retourne une campagne quand elle est a le même nom', async () => {
      // Given
      const campagne = uneCampagne()
      await campagneSqlRepository.save(campagne)
      const dateDebutUnMoisApres = campagne.dateDebut.plus({ month: 1 })
      const dateFInUnMoisApres = campagne.dateFin.plus({ month: 1 })

      // When
      const campagneCherchee = await campagneSqlRepository.getByIntervalOrName(
        dateDebutUnMoisApres,
        dateFInUnMoisApres,
        campagne.nom
      )
      // Then
      expect(campagneCherchee).to.deep.equal(campagne)
    })

    it("retourne undefined quand il n'y a pas de campagne sur l'intervalle", async () => {
      // Given
      const campagne = uneCampagne()
      await campagneSqlRepository.save(campagne)
      const dateDebutUnMoisApres = campagne.dateDebut.plus({ month: 1 })
      const dateFInUnMoisApres = campagne.dateFin.plus({ month: 1 })

      // When
      const campagneCherchee = await campagneSqlRepository.getByIntervalOrName(
        dateDebutUnMoisApres,
        dateFInUnMoisApres,
        'nom'
      )
      // Then
      expect(campagneCherchee).to.be.undefined()
    })
  })
})
