import { DateTime } from 'luxon'
import { GetDemarchesQueryGetter } from 'src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from 'src/application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { GetMonSuiviPoleEmploiQueryModel } from 'src/application/queries/query-models/jeunes.pole-emploi.query-model'
import { Core } from 'src/domain/core'
import { uneDemarcheQueryModel } from 'test/fixtures/query-models/demarche.query-model.fixtures'
import { unRendezVousQueryModel } from 'test/fixtures/query-models/rendez-vous.query-model.fixtures'
import { JeuneAuthorizer } from '../../../../src/application/authorizers/jeune-authorizer'
import { GetMonSuiviPoleEmploiQueryHandler } from '../../../../src/application/queries/milo/get-mon-suivi-jeune.pole-emploi.query.handler.db'
import {
  emptySuccess,
  isSuccess,
  Result,
  success
} from '../../../../src/building-blocks/types/result'
import { unUtilisateurJeune } from '../../../fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from '../../../utils'
import Structure = Core.Structure

describe('GetMonSuiviPoleEmploiQueryHandler', () => {
  let getRendezVousJeuneQueryGetter: StubbedClass<GetRendezVousJeunePoleEmploiQueryGetter>
  let getDemarchesQueryGetter: StubbedClass<GetDemarchesQueryGetter>
  let handler: GetMonSuiviPoleEmploiQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>

  const utilisateurJeunePE = unUtilisateurJeune({
    structure: Structure.POLE_EMPLOI
  })
  const dateDebut = DateTime.fromISO('2024-01-14T12:00:00Z', {
    setZone: true
  })

  beforeEach(async () => {
    getRendezVousJeuneQueryGetter = stubClass(
      GetRendezVousJeunePoleEmploiQueryGetter
    )
    getDemarchesQueryGetter = stubClass(GetDemarchesQueryGetter)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    handler = new GetMonSuiviPoleEmploiQueryHandler(
      jeuneAuthorizer,
      getRendezVousJeuneQueryGetter,
      getDemarchesQueryGetter
    )
  })

  describe('handle', () => {
    const rdv = unRendezVousQueryModel({
      date: dateDebut.plus({ hour: 1 }).toJSDate()
    })
    const demarche = uneDemarcheQueryModel()

    let result: Result<GetMonSuiviPoleEmploiQueryModel>
    beforeEach(async () => {
      getRendezVousJeuneQueryGetter.handle.resolves(
        success({
          queryModel: [rdv]
        })
      )
      getDemarchesQueryGetter.handle.resolves(
        success({
          queryModel: [demarche]
        })
      )

      result = await handler.handle({
        idJeune: 'id-jeune',
        dateDebut,
        accessToken: 'accessToken'
      })
    })

    it('renvoie les rendez-vous', async () => {
      // Then
      expect(
        getRendezVousJeuneQueryGetter.handle
      ).to.have.been.calledOnceWithExactly({
        idJeune: 'id-jeune',
        dateDebut,
        accessToken: 'accessToken'
      })
      expect(isSuccess(result) && result.data.rendezVous).to.deep.equal([rdv])
    })

    it('renvoie les démarches', async () => {
      expect(getDemarchesQueryGetter.handle).to.have.been.calledOnceWithExactly(
        {
          idJeune: 'id-jeune',
          tri: GetDemarchesQueryGetter.Tri.parDateFin,
          dateDebut,
          accessToken: 'accessToken'
        }
      )
      expect(isSuccess(result) && result.data.demarches).to.deep.equal([
        demarche
      ])
    })
  })

  describe('authorize', () => {
    it('appelle l’authorizer idoine', async () => {
      // Given
      jeuneAuthorizer.autoriserLeJeune.resolves(emptySuccess())

      // When
      const result = await handler.authorize(
        {
          idJeune: 'id-jeune',
          dateDebut,
          accessToken: 'token'
        },
        utilisateurJeunePE
      )

      // Then
      expect(
        jeuneAuthorizer.autoriserLeJeune
      ).to.have.been.calledOnceWithExactly('id-jeune', utilisateurJeunePE, true)
      expect(result).to.deep.equal(emptySuccess())
    })
  })
})

// async function createActions(
//   dates: DateTime[],
//   statut?: Action.Statut
// ): Promise<Array<AsSql<ActionDto>>> {
//   const dtos = dates.map(date => {
//     return uneActionDto({
//       dateEcheance: date.toJSDate(),
//       statut: statut ?? Action.Statut.PAS_COMMENCEE
//     })
//   })
//   await ActionSqlModel.bulkCreate(dtos)
//   return dtos
// }

// async function createRendezVous(
//   dates: DateTime[],
//   idJeune: string
// ): Promise<Array<AsSql<RendezVousDto>>> {
//   const rendezVousDtos = dates.map(date => {
//     return unRendezVousDto({
//       date: date.toJSDate()
//     })
//   })
//   const associationDtos = rendezVousDtos.map(rdv => {
//     return { idJeune, idRendezVous: rdv.id }
//   })
//   await RendezVousSqlModel.bulkCreate(rendezVousDtos)
//   await RendezVousJeuneAssociationSqlModel.bulkCreate(associationDtos)
//   return rendezVousDtos
// }
