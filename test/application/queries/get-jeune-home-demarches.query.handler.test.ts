import { expect, StubbedClass, stubClass } from '../../utils'
import { GetCampagneQueryModel } from '../../../src/application/queries/query-getters/get-campagne.query.getter'
import { uneCampagneQueryModel } from '../../fixtures/campagne.fixture'
import { GetJeuneHomeDemarchesQueryHandler } from '../../../src/application/queries/get-jeune-home-demarches.query.handler'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { desDemarchesQueryModel } from '../../fixtures/query-models/demarche.query-model.fixtures'
import { failure, success } from '../../../src/building-blocks/types/result'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { GetDemarchesQueryGetter } from '../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { JeuneHomeDemarcheQueryModel } from '../../../src/application/queries/query-models/home-jeune.query-model'
import { Cached } from '../../../src/building-blocks/types/query'
import { Core } from '../../../src/domain/core'

describe('GetJeuneHomeDemarchesQueryHandler', () => {
  let getActionsJeunePoleEmploiQueryGetter: StubbedClass<GetDemarchesQueryGetter>
  let getCampagneQueryModel: StubbedClass<GetCampagneQueryModel>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let getJeuneHomeDemarchesQueryHandler: GetJeuneHomeDemarchesQueryHandler

  const campagneQueryModel = uneCampagneQueryModel()
  const demarchesQueryModel = desDemarchesQueryModel()

  beforeEach(() => {
    getActionsJeunePoleEmploiQueryGetter = stubClass(GetDemarchesQueryGetter)
    getCampagneQueryModel = stubClass(GetCampagneQueryModel)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    getJeuneHomeDemarchesQueryHandler = new GetJeuneHomeDemarchesQueryHandler(
      getActionsJeunePoleEmploiQueryGetter,
      getCampagneQueryModel,
      jeuneAuthorizer
    )
  })

  describe('handle', () => {
    describe('quand il y a une failure', () => {
      it('retourne la failure', async () => {
        // Given
        getActionsJeunePoleEmploiQueryGetter.handle
          .withArgs({
            idJeune: 'idJeune',
            accessToken: 'token',
            tri: GetDemarchesQueryGetter.Tri.parSatutEtDateFin
          })
          .resolves(failure(new ErreurHttp("C'est cassé", 400)))

        getCampagneQueryModel.handle
          .withArgs({ idJeune: 'idJeune' })
          .resolves(campagneQueryModel)

        // When
        const home = await getJeuneHomeDemarchesQueryHandler.handle({
          idJeune: 'idJeune',
          accessToken: 'token'
        })

        // Then
        expect(home).to.deep.equal(failure(new ErreurHttp("C'est cassé", 400)))
      })
    })
    describe("quand c'est en succès", () => {
      it('retourne la campagne et les démarches', async () => {
        // Given
        getActionsJeunePoleEmploiQueryGetter.handle
          .withArgs({
            idJeune: 'idJeune',
            accessToken: 'token',
            tri: GetDemarchesQueryGetter.Tri.parSatutEtDateFin
          })
          .resolves(success({ queryModel: demarchesQueryModel }))

        getCampagneQueryModel.handle
          .withArgs({ idJeune: 'idJeune' })
          .resolves(campagneQueryModel)

        // When
        const home = await getJeuneHomeDemarchesQueryHandler.handle({
          idJeune: 'idJeune',
          accessToken: 'token'
        })

        // Then
        const data: Cached<JeuneHomeDemarcheQueryModel> = {
          queryModel: {
            actions: demarchesQueryModel,
            campagne: campagneQueryModel
          },
          dateDuCache: undefined
        }
        expect(home).to.deep.equal(success(data))
      })
    })
  })

  describe('authorize', () => {
    it('authorize un jeune PE', async () => {
      // When
      await getJeuneHomeDemarchesQueryHandler.authorize(
        {
          idJeune: 'idJeune',
          accessToken: 'token'
        },
        unUtilisateurJeune()
      )

      // Then
      expect(jeuneAuthorizer.authorize).to.have.been.calledWithExactly(
        'idJeune',
        unUtilisateurJeune(),
        Core.structuresPoleEmploiBRSA
      )
    })
  })
})
