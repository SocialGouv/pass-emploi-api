import { expect } from '../../utils'
import { CampagneSqlRepository } from '../../../src/infrastructure/repositories/campagne-sql.repository.db'
import {
  uneCampagne,
  uneEvaluationComplete,
  uneEvaluationIncomplete
} from '../../fixtures/campagne.fixture'
import { CampagneSqlModel } from '../../../src/infrastructure/sequelize/models/campagne.sql-model'
import { DateTime } from 'luxon'
import { ReponseCampagneSqlModel } from '../../../src/infrastructure/sequelize/models/reponse-campagne.sql-model'
import { getDatabase } from '../../utils/database-for-testing'

describe('CampagneSqlRepository', () => {
  let campagneSqlRepository: CampagneSqlRepository

  beforeEach(async () => {
    await getDatabase().cleanPG()
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
      expect(DateTime.fromJSDate(campagnesSql[0].dateFin)).to.deep.equal(
        campagne.dateFin
      )
      expect(DateTime.fromJSDate(campagnesSql[0].dateDebut)).to.deep.equal(
        campagne.dateDebut
      )
    })
  })

  describe('get', () => {
    it('récupère une campagne', async () => {
      // Given
      const campagne = uneCampagne()
      await campagneSqlRepository.save(campagne)

      // When
      const actual = await campagneSqlRepository.get(campagne.id)

      // Then
      expect(actual).to.deep.equal(campagne)
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

  describe('saveEvaluation', () => {
    const campagne = uneCampagne()

    beforeEach(async () => {
      await campagneSqlRepository.save(campagne)
    })

    describe("quand c'est la première sur une campagne", () => {
      it('la crée', async () => {
        // Given
        const evaluation = uneEvaluationIncomplete()

        // When
        await campagneSqlRepository.saveEvaluation(evaluation)

        // Then
        const reponseCampagneSqlModels = await ReponseCampagneSqlModel.findAll()
        expect(reponseCampagneSqlModels).to.have.length(1)
        expect(reponseCampagneSqlModels[0].idCampagne).to.equal(
          evaluation.idCampagne
        )
        expect(reponseCampagneSqlModels[0].idJeune).to.equal(
          evaluation.jeune.id
        )
        expect(reponseCampagneSqlModels[0].structureJeune).to.equal(
          evaluation.jeune.structure
        )
        expect(reponseCampagneSqlModels[0].dateCreationJeune).to.deep.equal(
          evaluation.jeune.dateCreation.toJSDate()
        )
        expect(reponseCampagneSqlModels[0].dateReponse).to.deep.equal(
          evaluation.date.toJSDate()
        )
        expect(reponseCampagneSqlModels[0].reponse1).to.equal(
          evaluation.reponses[0].idReponse.toString()
        )
        expect(reponseCampagneSqlModels[0].pourquoi1).to.equal(
          evaluation.reponses[0].pourquoi
        )
      })
    })

    describe("quand c'est la seconde sur une campagne", () => {
      it("l'écrase", async () => {
        // Given
        await campagneSqlRepository.saveEvaluation(uneEvaluationIncomplete())
        const evaluationComplete = uneEvaluationComplete()

        // When
        await campagneSqlRepository.saveEvaluation(evaluationComplete)

        // Then
        const reponseCampagneSqlModels = await ReponseCampagneSqlModel.findAll()
        expect(reponseCampagneSqlModels).to.have.length(1)
        expect(reponseCampagneSqlModels[0].idCampagne).to.equal(
          evaluationComplete.idCampagne
        )
        expect(reponseCampagneSqlModels[0].idJeune).to.equal(
          evaluationComplete.jeune.id
        )
        expect(reponseCampagneSqlModels[0].structureJeune).to.equal(
          evaluationComplete.jeune.structure
        )
        expect(reponseCampagneSqlModels[0].dateCreationJeune).to.deep.equal(
          evaluationComplete.jeune.dateCreation.toJSDate()
        )
        expect(reponseCampagneSqlModels[0].dateReponse).to.deep.equal(
          evaluationComplete.date.toJSDate()
        )
        expect(reponseCampagneSqlModels[0].reponse1).to.equal(
          evaluationComplete.reponses[0].idReponse.toString()
        )
        expect(reponseCampagneSqlModels[0].pourquoi1).to.equal(null)
        expect(reponseCampagneSqlModels[0].reponse2).to.equal(
          evaluationComplete.reponses[1].idReponse.toString()
        )
        expect(reponseCampagneSqlModels[0].pourquoi2).to.equal(
          evaluationComplete.reponses[1].pourquoi
        )
        expect(reponseCampagneSqlModels[0].reponse3).to.equal(
          evaluationComplete.reponses[2].idReponse.toString()
        )
        expect(reponseCampagneSqlModels[0].pourquoi3).to.equal(
          evaluationComplete.reponses[2].pourquoi
        )
        expect(reponseCampagneSqlModels[0].reponse4).to.equal(
          evaluationComplete.reponses[3].idReponse.toString()
        )
        expect(reponseCampagneSqlModels[0].pourquoi4).to.equal(
          evaluationComplete.reponses[3].pourquoi
        )
      })
    })
  })
})
