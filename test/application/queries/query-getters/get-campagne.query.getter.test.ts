import {
  DatabaseForTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../../utils'
import { DateService } from '../../../../src/utils/date-service'
import {
  GetCampagneQueryModel,
  questionsInMemory
} from '../../../../src/application/queries/query-getters/get-campagne.query.getter'
import { CampagneSqlModel } from '../../../../src/infrastructure/sequelize/models/campagne.sql-model'
import { DateTime } from 'luxon'
import { ReponseCampagneSqlModel } from '../../../../src/infrastructure/sequelize/models/reponse-campagne.sql-model'
import { Campagne } from '../../../../src/domain/campagne'

describe('GetCampagneQueryModel', () => {
  DatabaseForTesting.prepare()
  let dateService: StubbedClass<DateService>
  let getCampagneQueryModel: GetCampagneQueryModel
  const maintenant = DateTime.fromISO('2022-05-17T03:24:00')
  const idCampagnePassee = 'f59ca6cc-6a7b-4db9-845f-1e39e86ef6cb'
  const questions = questionsInMemory()

  beforeEach(async () => {
    dateService = stubClass(DateService)
    dateService.nowJs.returns(maintenant.toJSDate())

    await CampagneSqlModel.create({
      id: idCampagnePassee,
      dateDebut: maintenant.minus({ month: 3 }).toJSDate(),
      dateFin: maintenant.minus({ month: 2 }).toJSDate(),
      nom: 'Campagne passée'
    })

    await ReponseCampagneSqlModel.create({
      idJeune: 'idJeune',
      structureJeune: 'MILO',
      idCampagne: idCampagnePassee,
      dateReponse: maintenant.minus({ month: 3 }).toJSDate(),
      dateCreationJeune: maintenant.minus({ month: 5 }).toJSDate(),
      reponse1: '3',
      reponse2: '4'
    })

    getCampagneQueryModel = new GetCampagneQueryModel(dateService)
  })

  describe('quand il ny a pas de campagne en cours', () => {
    it('retourne undefined', async () => {
      // When
      const campagne = await getCampagneQueryModel.handle({
        idJeune: 'idJeune'
      })

      // Then
      expect(campagne).to.be.undefined()
    })
  })

  describe('quand il y a une campagne en cours', () => {
    const campagneEnCours: Campagne = {
      id: '72c0c68a-aea1-4070-9a68-0e864cfafa59',
      dateDebut: maintenant.minus({ week: 1 }),
      dateFin: maintenant.plus({ week: 1 }),
      nom: 'Campagne en cours'
    }

    beforeEach(async () => {
      await CampagneSqlModel.create({
        id: campagneEnCours.id,
        dateDebut: campagneEnCours.dateDebut.toJSDate(),
        dateFin: campagneEnCours.dateFin.toJSDate(),
        nom: campagneEnCours.nom
      })
    })

    describe("quand le jeune n'a répondu à rien", () => {
      it('retourne la campagne', async () => {
        // When
        const campagne = await getCampagneQueryModel.handle({
          idJeune: 'idJeune'
        })

        // Then
        expect(campagne).to.be.deep.equal({
          id: campagneEnCours.id,
          dateDebut: campagneEnCours.dateDebut.toUTC().toString(),
          dateFin: campagneEnCours.dateFin.toUTC().toString(),
          description: "Votre expérience sur l'application",
          titre: 'Donnez nous votre avis',
          questions
        })
      })
    })
    describe("quand le jeune n'a répondu qu'à la première question", () => {
      it('retourne la campagne', async () => {
        // Given
        await ReponseCampagneSqlModel.create({
          idJeune: 'idJeune',
          structureJeune: 'MILO',
          idCampagne: campagneEnCours.id,
          dateReponse: maintenant.minus({ day: 1 }).toJSDate(),
          dateCreationJeune: maintenant.minus({ month: 5 }).toJSDate(),
          reponse1: '3'
        })

        // When
        const campagne = await getCampagneQueryModel.handle({
          idJeune: 'idJeune'
        })

        // Then
        expect(campagne).to.be.deep.equal({
          id: campagneEnCours.id,
          dateDebut: campagneEnCours.dateDebut.toUTC().toString(),
          dateFin: campagneEnCours.dateFin.toUTC().toString(),
          description: "Votre expérience sur l'application",
          titre: 'Donnez nous votre avis',
          questions
        })
      })
    })
    describe('quand le jeune a répondu aux 2 questions', () => {
      it('retourne undefined', async () => {
        // Given
        await ReponseCampagneSqlModel.create({
          idJeune: 'idJeune',
          structureJeune: 'MILO',
          idCampagne: campagneEnCours.id,
          dateReponse: maintenant.minus({ day: 1 }).toJSDate(),
          dateCreationJeune: maintenant.minus({ month: 5 }).toJSDate(),
          reponse1: '3',
          reponse2: '2'
        })

        // When
        const campagne = await getCampagneQueryModel.handle({
          idJeune: 'idJeune'
        })

        // Then
        expect(campagne).to.be.undefined()
      })
    })
  })
})
