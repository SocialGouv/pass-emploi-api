import { expect, StubbedClass, stubClass } from '../../utils'
import { GetCampagneQueryModel } from '../../../src/application/queries/query-getters/get-campagne.query.getter'
import { uneCampagneQueryModel } from '../../fixtures/campagne.fixture'
import { GetJeuneHomeDemarchesQueryHandler } from '../../../src/application/queries/get-jeune-home-demarches.query.handler'
import { JeunePoleEmploiAuthorizer } from '../../../src/application/authorizers/authorize-jeune-pole-emploi'
import { desDemarchesQueryModel } from '../../fixtures/query-models/demarche.query-model.fixtures'
import { failure, success } from '../../../src/building-blocks/types/result'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { GetDemarchesQueryGetter } from '../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'

describe('GetJeuneHomeDemarchesQueryHandler', () => {
  let getActionsJeunePoleEmploiQueryGetter: StubbedClass<GetDemarchesQueryGetter>
  let getCampagneQueryModel: StubbedClass<GetCampagneQueryModel>
  let jeunePoleEmploiAuthorizer: StubbedClass<JeunePoleEmploiAuthorizer>
  let getJeuneHomeDemarchesQueryHandler: GetJeuneHomeDemarchesQueryHandler

  const campagneQueryModel = uneCampagneQueryModel()
  const demarchesQueryModel = desDemarchesQueryModel()

  beforeEach(() => {
    getActionsJeunePoleEmploiQueryGetter = stubClass(GetDemarchesQueryGetter)
    getCampagneQueryModel = stubClass(GetCampagneQueryModel)
    jeunePoleEmploiAuthorizer = stubClass(JeunePoleEmploiAuthorizer)

    getJeuneHomeDemarchesQueryHandler = new GetJeuneHomeDemarchesQueryHandler(
      getActionsJeunePoleEmploiQueryGetter,
      getCampagneQueryModel,
      jeunePoleEmploiAuthorizer
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
          .resolves(success(demarchesQueryModel))

        getCampagneQueryModel.handle
          .withArgs({ idJeune: 'idJeune' })
          .resolves(campagneQueryModel)

        // When
        const home = await getJeuneHomeDemarchesQueryHandler.handle({
          idJeune: 'idJeune',
          accessToken: 'token'
        })

        // Then
        expect(home).to.deep.equal(
          success({
            actions: demarchesQueryModel,
            campagne: campagneQueryModel
          })
        )
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
      expect(
        jeunePoleEmploiAuthorizer.authorize
      ).to.have.been.calledWithExactly('idJeune', unUtilisateurJeune())
    })
  })
})
