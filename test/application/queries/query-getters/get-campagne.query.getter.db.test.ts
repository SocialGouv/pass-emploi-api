import { DateTime } from 'luxon'
import {
  GetCampagneQueryGetter,
  questionsInMemory
} from '../../../../src/application/queries/query-getters/get-campagne.query.getter.db'
import { Campagne } from '../../../../src/domain/campagne'
import { CampagneSqlModel } from '../../../../src/infrastructure/sequelize/models/campagne.sql-model'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { ReponseCampagneSqlModel } from '../../../../src/infrastructure/sequelize/models/reponse-campagne.sql-model'
import { DateService } from '../../../../src/utils/date-service'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { getDatabase } from '../../../utils/database-for-testing'

describe('GetCampagneQueryGetter', () => {
  beforeEach(async () => {
    await getDatabase().cleanPG()
  })

  let dateService: StubbedClass<DateService>
  let getCampagneQueryGetter: GetCampagneQueryGetter
  const maintenant = DateTime.fromISO('2022-05-17T03:24:00')
  const idCampagnePassee = 'f59ca6cc-6a7b-4db9-845f-1e39e86ef6cb'
  const questions = questionsInMemory()

  beforeEach(async () => {
    dateService = stubClass(DateService)
    dateService.nowJs.returns(maintenant.toJSDate())
    dateService.now.returns(maintenant)

    await CampagneSqlModel.create({
      id: idCampagnePassee,
      dateDebut: maintenant.minus({ month: 3 }).toJSDate(),
      dateFin: maintenant.minus({ month: 2 }).toJSDate(),
      nom: 'Campagne passée'
    })

    await ConseillerSqlModel.create(unConseillerDto({ id: 'idConseiller' }))
    await JeuneSqlModel.create(
      unJeuneDto({
        id: 'idJeune',
        idConseiller: 'idConseiller',
        datePremiereConnexion: maintenant.minus({ month: 3 }).toJSDate()
      })
    )

    await ReponseCampagneSqlModel.create({
      idJeune: 'idJeune',
      structureJeune: 'MILO',
      idCampagne: idCampagnePassee,
      dateReponse: maintenant.minus({ month: 3 }).toJSDate(),
      dateCreationJeune: maintenant.minus({ month: 5 }).toJSDate(),
      reponse1: '3',
      reponse2: '4'
    })

    getCampagneQueryGetter = new GetCampagneQueryGetter(dateService)
  })

  describe('quand il ny a pas de campagne en cours', () => {
    it('retourne undefined', async () => {
      // When
      const campagne = await getCampagneQueryGetter.handle({
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
        const campagne = await getCampagneQueryGetter.handle({
          idJeune: 'idJeune'
        })

        // Then
        expect(campagne).to.be.deep.equal({
          id: campagneEnCours.id,
          dateDebut: campagneEnCours.dateDebut.toISO(),
          dateFin: campagneEnCours.dateFin.toISO(),
          titre: "Votre expérience sur l'application",
          description:
            "Aidez-nous à améliorer l'application en répondant à 5 questions",
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
        const campagne = await getCampagneQueryGetter.handle({
          idJeune: 'idJeune'
        })

        // Then
        expect(campagne).to.be.deep.equal({
          id: campagneEnCours.id,
          dateDebut: campagneEnCours.dateDebut.toISO(),
          dateFin: campagneEnCours.dateFin.toISO(),
          titre: "Votre expérience sur l'application",
          description:
            "Aidez-nous à améliorer l'application en répondant à 5 questions",
          questions
        })
      })
    })
    describe('quand le jeune a répondu à toutes les questions', () => {
      it('retourne undefined', async () => {
        // Given
        await ReponseCampagneSqlModel.create({
          idJeune: 'idJeune',
          structureJeune: 'MILO',
          idCampagne: campagneEnCours.id,
          dateReponse: maintenant.minus({ day: 1 }).toJSDate(),
          dateCreationJeune: maintenant.minus({ month: 5 }).toJSDate(),
          reponse1: '3',
          reponse2: '2',
          reponse3: '1',
          reponse4: '7',
          reponse5: '1'
        })

        // When
        const campagne = await getCampagneQueryGetter.handle({
          idJeune: 'idJeune'
        })

        // Then
        expect(campagne).to.be.undefined()
      })
    })
    describe("quand le jeune n'a répondu à rien mais pas actif", () => {
      it('ne retourne pas la campagne', async () => {
        // Given
        await JeuneSqlModel.update(
          {
            datePremiereConnexion: maintenant.minus({ month: 1 }).toJSDate()
          },
          {
            where: {
              id: 'idJeune'
            }
          }
        )
        // When
        const campagne = await getCampagneQueryGetter.handle({
          idJeune: 'idJeune'
        })

        // Then
        expect(campagne).to.be.undefined()
      })
    })
  })
})
