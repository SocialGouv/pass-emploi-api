import { DateTime } from 'luxon'
import { GetJeuneHomeAgendaQueryHandler } from 'src/application/queries/get-jeune-home-agenda.query.db'
import { JeuneHomeSuiviQueryModel } from 'src/application/queries/query-models/home-jeune-suivi.query-model'
import {
  emptySuccess,
  isSuccess,
  Result,
  success
} from 'src/building-blocks/types/result'
import { Action } from 'src/domain/action/action'
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
import { ConseillerAgenceAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-agence'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { ActionQueryModel } from '../../../src/application/queries/query-models/actions.query-model'
import { RendezVousJeuneQueryModel } from '../../../src/application/queries/query-models/rendez-vous.query-model'
import { Core } from '../../../src/domain/core'
import { RendezVousJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { unRendezVousQueryModel } from '../../fixtures/query-models/rendez-vous.query-model.fixtures'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { expect, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'
import { testConfig } from '../../utils/module-for-testing'

describe('GetJeuneHomeAgendaQueryHandler', () => {
  const utilisateurJeune = unUtilisateurJeune()
  let handler: GetJeuneHomeAgendaQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let conseillerAgenceAuthorizer: StubbedClass<ConseillerAgenceAuthorizer>
  const aujourdhuiDimanche = '2022-08-14T12:00:00Z'
  const demain = new Date('2022-08-15T12:00:00Z')
  const apresDemain = new Date('2022-08-16T12:00:00Z')
  const jeuneDto = unJeuneDto()

  beforeEach(async () => {
    await getDatabase().cleanPG()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    conseillerAgenceAuthorizer = stubClass(ConseillerAgenceAuthorizer)
    handler = new GetJeuneHomeAgendaQueryHandler(
      jeuneAuthorizer,
      conseillerAgenceAuthorizer,
      testConfig()
    )
    await ConseillerSqlModel.creer(unConseillerDto())
    await JeuneSqlModel.creer(jeuneDto)
  })

  describe('handle', () => {
    it("doit retourner les événements bornés entre lundi dernier minuit et lundi en huit minuit, d'après la locale utilisateur", async () => {
      const aujourdhuiMercredi = '2022-08-17T00:00:00-07:00'
      const [_dimancheDernier, lundiDernier, dimancheEnHuit, _lundiEnHuit] =
        await createActions([
          '2022-08-14T23:59:00-07:00',
          '2022-08-15T00:00:00-07:00',
          '2022-08-28T23:59:00-07:00',
          '2022-08-29T00:00:00-07:00'
        ])

      // When
      const result = await handler.handle(
        {
          idJeune: 'ABCDE',
          maintenant: aujourdhuiMercredi
        },
        utilisateurJeune
      )

      // Then
      const expected: JeuneHomeSuiviQueryModel = {
        actions: [
          uneActionQueryModelSansJeune({
            id: lundiDernier.id,
            dateEcheance: DateTime.fromJSDate(lundiDernier.dateEcheance).toISO()
          }),
          uneActionQueryModelSansJeune({
            id: dimancheEnHuit.id,
            dateEcheance: DateTime.fromJSDate(
              dimancheEnHuit.dateEcheance
            ).toISO()
          })
        ],
        rendezVous: [],
        metadata: {
          actionsEnRetard: 2,
          dateDeDebut: lundiDernier.dateEcheance,
          dateDeFin: new Date('2022-08-29T07:00:00.000Z')
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
        result = await handler.handle(
          {
            idJeune: 'ABCDE',
            maintenant: aujourdhuiDimanche
          },
          utilisateurJeune
        )
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
        const result = await handler.handle(
          {
            idJeune: 'ABCDE',
            maintenant: aujourdhuiDimanche
          },
          utilisateurJeune
        )

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
        result = await handler.handle(
          {
            idJeune: 'ABCDE',
            maintenant: aujourdhuiDimanche
          },
          utilisateurJeune
        )
      })
      it("retourne le compte d'actions en retard et les dates", async () => {
        // Then
        expect(result._isSuccess && result.data.metadata).to.deep.equal({
          actionsEnRetard: 1,
          dateDeDebut: new Date('2022-08-08T00:00:00.000Z'),
          dateDeFin: new Date('2022-08-22T00:00:00.000Z')
        })
      })
    })
  })

  describe('authorize', () => {
    describe('quand c’est un jeune', () => {
      it('appelle l’authorizer idoine', async () => {
        // Given
        const jeune = unJeune()
        jeuneAuthorizer.authorize
          .withArgs(jeune.id, unUtilisateurJeune({ id: jeune.id }))
          .resolves(emptySuccess())

        // When
        const result = await handler.authorize(
          { idJeune: jeune.id, maintenant: aujourdhuiDimanche },
          unUtilisateurJeune()
        )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe('quand c’est un conseiller', () => {
      it('appelle l’authorizer idoine', async () => {
        // Given
        const jeune = unJeune()
        const utilisateur = unUtilisateurConseiller({
          structure: Core.Structure.MILO
        })

        const query = { idJeune: jeune.id, maintenant: aujourdhuiDimanche }

        // When
        await handler.authorize(query, utilisateur)

        // Then
        expect(
          conseillerAgenceAuthorizer.authorizeConseillerDuJeuneOuSonAgence
        ).to.have.been.calledWithExactly(jeune.id, utilisateur)
      })
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
