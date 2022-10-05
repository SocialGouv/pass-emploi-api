import { GetJeuneHomeAgendaQueryHandler } from 'src/application/queries/get-jeune-home-agenda.query.db'
import { JeuneHomeSuiviQueryModel } from 'src/application/queries/query-models/home-jeune-suivi.query-model'
import {
  emptySuccess,
  isSuccess,
  Result,
  success
} from 'src/building-blocks/types/result'
import {
  ActionDto,
  ActionSqlModel
} from 'src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { uneActionQueryModelSansJeune } from 'test/fixtures/query-models/action.query-model.fixtures'
import { uneActionDto } from 'test/fixtures/sql-models/action.sql-model'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { DatabaseForTesting } from 'test/utils/database-for-testing'
import { expect, StubbedClass, stubClass } from '../../utils'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.model'
import { unRendezVousQueryModel } from '../../fixtures/query-models/rendez-vous.query-model.fixtures'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { Action } from 'src/domain/action/action'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { unJeune } from '../../fixtures/jeune.fixture'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { ActionQueryModel } from '../../../src/application/queries/query-models/actions.query-model'
import { RendezVousJeuneQueryModel } from '../../../src/application/queries/query-models/rendez-vous.query-model'
import { DateTime } from 'luxon'

describe('GetJeuneHomeAgendaQueryHandler', () => {
  DatabaseForTesting.prepare()
  let handler: GetJeuneHomeAgendaQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  const aujourdhuiVendredi = '2022-08-12T12:00:00Z'
  const demain = new Date('2022-08-13T12:00:00Z')
  const apresDemain = new Date('2022-08-14T12:00:00Z')
  const jeuneDto = unJeuneDto()

  beforeEach(async () => {
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    handler = new GetJeuneHomeAgendaQueryHandler(jeuneAuthorizer)
    await ConseillerSqlModel.creer(unConseillerDto())
    await JeuneSqlModel.creer(jeuneDto)
  })

  describe('handle', () => {
    it("doit retourner les événements bornés entre samedi dernier minuit et samedi en huit minuit, d'après la locale utilisateur", async () => {
      const aujourdhuiLundi = '2022-08-15T00:00:00-07:00'
      const [_vendrediDernier, samediDernier, vendrediEnHuit, _samediEnHuit] =
        await createActions([
          '2022-08-12T23:59:00-07:00',
          '2022-08-13T00:00:00-07:00',
          '2022-08-26T23:59:00-07:00',
          '2022-08-27T00:00:00-07:00'
        ])

      // When
      const result = await handler.handle({
        idJeune: 'ABCDE',
        maintenant: aujourdhuiLundi
      })

      // Then
      const expected: JeuneHomeSuiviQueryModel = {
        actions: [
          uneActionQueryModelSansJeune({
            id: samediDernier.id,
            dateEcheance: DateTime.fromJSDate(
              samediDernier.dateEcheance
            ).toISO()
          }),
          uneActionQueryModelSansJeune({
            id: vendrediEnHuit.id,
            dateEcheance: DateTime.fromJSDate(
              vendrediEnHuit.dateEcheance
            ).toISO()
          })
        ],
        rendezVous: [],
        metadata: {
          actionsEnRetard: 2,
          dateDeDebut: samediDernier.dateEcheance,
          dateDeFin: new Date('2022-08-27T07:00:00.000Z')
        }
      }
      expect(result).to.deep.equal(success(expected))
    })

    describe('actions', () => {
      let demain: AsSql<ActionDto>
      let apresDemain: AsSql<ActionDto>
      let result: Result<JeuneHomeSuiviQueryModel>

      beforeEach(async () => {
        ;[demain, apresDemain] = await createActions([
          '2022-08-13T12:00:00Z',
          '2022-08-14T12:00:00Z'
        ])

        // When
        result = await handler.handle({
          idJeune: 'ABCDE',
          maintenant: aujourdhuiVendredi
        })
      })
      it('doit retourner la liste des actions triées chronologiquement', async () => {
        // Then
        const actionsQM: ActionQueryModel[] = [
          uneActionQueryModelSansJeune({
            id: demain.id,
            dateEcheance: DateTime.fromJSDate(demain.dateEcheance).toISO()
          }),
          uneActionQueryModelSansJeune({
            id: apresDemain.id,
            dateEcheance: DateTime.fromJSDate(apresDemain.dateEcheance).toISO()
          })
        ]
        expect(isSuccess(result) && result.data.actions).to.deep.equal(
          actionsQM
        )
      })
    })
    describe('rendez-vous', () => {
      it('renvoie les rendez-vous triés par date', async () => {
        // Given
        const unRendezVousDtoPourDemain = unRendezVousDto({
          date: demain
        })
        const unRendezVousDtoPourApresDemain = unRendezVousDto({
          date: apresDemain
        })

        await RendezVousSqlModel.bulkCreate([
          unRendezVousDtoPourDemain,
          unRendezVousDtoPourApresDemain
        ])
        await RendezVousJeuneAssociationSqlModel.bulkCreate([
          { idJeune: jeuneDto.id, idRendezVous: unRendezVousDtoPourDemain.id },
          {
            idJeune: jeuneDto.id,
            idRendezVous: unRendezVousDtoPourApresDemain.id
          }
        ])

        // When
        const result = await handler.handle({
          idJeune: 'ABCDE',
          maintenant: aujourdhuiVendredi
        })

        // Then
        const expected: RendezVousJeuneQueryModel[] = [
          unRendezVousQueryModel({
            id: unRendezVousDtoPourDemain.id,
            date: unRendezVousDtoPourDemain.date
          }),
          unRendezVousQueryModel({
            id: unRendezVousDtoPourApresDemain.id,
            date: unRendezVousDtoPourApresDemain.date
          })
        ]
        expect(isSuccess(result) && result.data.rendezVous).to.deep.equal(
          expected
        )
      })
    })
    describe('metadata', () => {
      let result: Result<JeuneHomeSuiviQueryModel>

      beforeEach(async () => {
        const hier = '2022-08-11T12:00:00Z'
        const dansUneSemaine = '2022-08-19T12:00:00Z'
        await createActions([hier], Action.Statut.TERMINEE)
        await createActions([hier], Action.Statut.ANNULEE)
        await createActions([hier, dansUneSemaine], Action.Statut.PAS_COMMENCEE)

        // When
        result = await handler.handle({
          idJeune: 'ABCDE',
          maintenant: aujourdhuiVendredi
        })
      })
      it("retourne le compte d'actions en retard et les dates", async () => {
        // Then
        expect(result._isSuccess && result.data.metadata).to.deep.equal({
          actionsEnRetard: 1,
          dateDeDebut: new Date('2022-08-06T00:00:00.000Z'),
          dateDeFin: new Date('2022-08-20T00:00:00.000Z')
        })
      })
    })
  })

  describe('authorize', () => {
    it('autorise un jeune', async () => {
      // Given
      const jeune = unJeune()
      jeuneAuthorizer.authorize
        .withArgs(jeune.id, unUtilisateurJeune({ id: jeune.id }))
        .resolves(emptySuccess())

      // When
      const result = await handler.authorize(
        { idJeune: jeune.id, maintenant: aujourdhuiVendredi },
        unUtilisateurJeune()
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
  })
})

async function createActions(
  dates: string[],
  statut?: Action.Statut
): Promise<Array<AsSql<ActionDto>>> {
  const dtos = dates.map(date => {
    return uneActionDto({
      dateEcheance: DateTime.fromISO(date).toJSDate(),
      statut: statut ?? Action.Statut.PAS_COMMENCEE
    })
  })
  await ActionSqlModel.bulkCreate(dtos)
  return dtos
}
