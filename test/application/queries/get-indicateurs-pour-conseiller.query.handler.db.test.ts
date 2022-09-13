import {
  GetIndicateursPourConseillerQuery,
  GetIndicateursPourConseillerQueryHandler
} from '../../../src/application/queries/get-indicateurs-pour-conseiller.query.handler.db'
import { expect, StubbedClass, stubClass } from '../../utils'
import { isSuccess } from '../../../src/building-blocks/types/result'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { Action } from '../../../src/domain/action/action'
import Statut = Action.Statut
import { DateTime } from 'luxon'
import { DateService } from '../../../src/utils/date-service'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.model'

describe('GetIndicateursPourConseillerQueryHandler', () => {
  DatabaseForTesting.prepare()
  let getIndicateursPourConseillerQueryHandler: GetIndicateursPourConseillerQueryHandler
  let dateService: StubbedClass<DateService>
  const idConseiller = 'id-conseiller'
  const idJeune = 'id-jeune'

  before(async () => {
    dateService = stubClass(DateService)
    getIndicateursPourConseillerQueryHandler =
      new GetIndicateursPourConseillerQueryHandler(dateService)
  })

  describe('handle', () => {
    beforeEach(async () => {
      const conseillerDto = unConseillerDto({ id: idConseiller })
      await ConseillerSqlModel.creer(conseillerDto)
      const jeuneDto = unJeuneDto({ id: idJeune, idConseiller })
      await JeuneSqlModel.creer(jeuneDto)
    })

    const dateDebut = DateTime.fromISO('2022-03-01T03:24:00')
    const dateFin = DateTime.fromISO('2022-03-08T03:24:00')

    describe('indicateurs actions', () => {
      it('récupère le nombre d’actions créées entre deux dates', async () => {
        // Given
        const dateCreation = DateTime.fromISO('2022-03-05T03:24:00')

        const query: GetIndicateursPourConseillerQuery = {
          idJeune,
          dateDebut: dateDebut.toString(),
          dateFin: dateFin.toString()
        }

        const actionDto = uneActionDto({
          dateCreation: dateCreation.toJSDate(),
          idJeune
        })
        await ActionSqlModel.creer(actionDto)

        // When
        const response = await getIndicateursPourConseillerQueryHandler.handle(
          query
        )

        // Then
        expect(
          isSuccess(response) && response.data.actions.creees
        ).to.deep.equal(1)
      })

      it('récupère le nombre d’actions en retard entre deux dates', async () => {
        // Given
        const dateEcheance = DateTime.fromISO('2022-03-06T03:24:00')
        const dateDuJourApresEcheance = '2022-03-07T03:24:00'
        dateService.nowJs.returns(
          DateTime.fromISO(dateDuJourApresEcheance).toJSDate()
        )

        const query: GetIndicateursPourConseillerQuery = {
          idJeune,
          dateDebut: dateDebut.toString(),
          dateFin: dateFin.toString()
        }

        const actionDto = uneActionDto({
          idJeune,
          dateEcheance: dateEcheance.toJSDate(),
          statut: Statut.PAS_COMMENCEE
        })
        await ActionSqlModel.creer(actionDto)

        // When
        const response = await getIndicateursPourConseillerQueryHandler.handle(
          query
        )

        // Then
        expect(
          isSuccess(response) && response.data.actions.enRetard
        ).to.deep.equal(1)
      })

      it('récupère le nombre d’actions terminées entre deux dates', async () => {
        // Given
        const dateFinReelle = DateTime.fromISO('2022-03-06T03:24:00')

        const query: GetIndicateursPourConseillerQuery = {
          idJeune,
          dateDebut: dateDebut.toString(),
          dateFin: dateFin.toString()
        }

        const actionDto = uneActionDto({
          idJeune,
          dateFinReelle: dateFinReelle.toJSDate(),
          statut: Statut.TERMINEE
        })
        await ActionSqlModel.creer(actionDto)

        // When
        const response = await getIndicateursPourConseillerQueryHandler.handle(
          query
        )

        // Then
        expect(
          isSuccess(response) && response.data.actions.terminees
        ).to.deep.equal(1)
      })

      it('récupère le nombre d’actions à échéance entre deux dates', async () => {
        // Given
        const dateEcheance = DateTime.fromISO('2022-03-06T03:24:00')

        const query: GetIndicateursPourConseillerQuery = {
          idJeune,
          dateDebut: dateDebut.toString(),
          dateFin: dateFin.toString()
        }

        const actionDto = uneActionDto({
          idJeune,
          dateEcheance: dateEcheance.toJSDate(),
          statut: Statut.TERMINEE
        })
        await ActionSqlModel.creer(actionDto)

        // When
        const response = await getIndicateursPourConseillerQueryHandler.handle(
          query
        )

        // Then
        expect(
          isSuccess(response) && response.data.actions.aEcheance
        ).to.deep.equal(1)
      })
    })
    describe('indicateurs rendez-vous', () => {
      it('récupère le nombre de rendez-vous planifiés', async () => {
        // Given
        const query: GetIndicateursPourConseillerQuery = {
          idJeune,
          dateDebut: dateDebut.toString(),
          dateFin: dateFin.toString()
        }
        const idRendezVous = 'b3b010f2-1d14-45db-bb15-cf1fa361fbdc'
        const dateRendezVous = new Date('2022-03-06T03:24:00')

        const rendezVousDto = unRendezVousDto({
          id: idRendezVous,
          date: dateRendezVous
        })

        await RendezVousSqlModel.create(rendezVousDto)
        await RendezVousJeuneAssociationSqlModel.create({
          idJeune,
          idRendezVous
        })

        // When
        const response = await getIndicateursPourConseillerQueryHandler.handle(
          query
        )

        // Then
        expect(
          isSuccess(response) && response.data.rendezVous.planifies
        ).to.deep.equal(1)
      })
    })
  })
})
