import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { GetJeuneHomeDemarchesQueryHandler } from '../../../src/application/queries/get-jeune-home-demarches.query.handler'
import { GetCampagneQueryGetter } from '../../../src/application/queries/query-getters/get-campagne.query.getter'
import { GetDemarchesQueryGetter } from '../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { JeuneHomeDemarcheQueryModel } from '../../../src/application/queries/query-models/home-jeune.query-model'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import { Cached } from '../../../src/building-blocks/types/query'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Core, estPoleEmploi } from '../../../src/domain/core'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneCampagneQueryModel } from '../../fixtures/campagne.fixture'
import { desDemarchesQueryModel } from '../../fixtures/query-models/demarche.query-model.fixtures'
import { expect, StubbedClass, stubClass } from '../../utils'
import Structure = Core.Structure

describe('GetJeuneHomeDemarchesQueryHandler', () => {
  let getActionsJeunePoleEmploiQueryGetter: StubbedClass<GetDemarchesQueryGetter>
  let getCampagneQueryGetter: StubbedClass<GetCampagneQueryGetter>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let getJeuneHomeDemarchesQueryHandler: GetJeuneHomeDemarchesQueryHandler

  const campagneQueryModel = uneCampagneQueryModel()
  const demarchesQueryModel = desDemarchesQueryModel()

  beforeEach(() => {
    getActionsJeunePoleEmploiQueryGetter = stubClass(GetDemarchesQueryGetter)
    getCampagneQueryGetter = stubClass(GetCampagneQueryGetter)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    getJeuneHomeDemarchesQueryHandler = new GetJeuneHomeDemarchesQueryHandler(
      getActionsJeunePoleEmploiQueryGetter,
      getCampagneQueryGetter,
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

        getCampagneQueryGetter.handle
          .withArgs({ idJeune: 'idJeune' })
          .resolves(campagneQueryModel)

        // When
        const home = await getJeuneHomeDemarchesQueryHandler.handle(
          {
            idJeune: 'idJeune',
            accessToken: 'token'
          },
          unUtilisateurJeune()
        )

        // Then
        expect(home).to.deep.equal(failure(new ErreurHttp("C'est cassé", 400)))
      })
    })
    describe("quand c'est en succès", () => {
      beforeEach(async () => {
        // Given
        getActionsJeunePoleEmploiQueryGetter.handle
          .withArgs({
            idJeune: 'idJeune',
            accessToken: 'token',
            tri: GetDemarchesQueryGetter.Tri.parSatutEtDateFin
          })
          .resolves(success({ queryModel: demarchesQueryModel }))

        getCampagneQueryGetter.handle
          .withArgs({ idJeune: 'idJeune' })
          .resolves(campagneQueryModel)
      })

      it('retourne la campagne et les démarches', async () => {
        // When
        const home = await getJeuneHomeDemarchesQueryHandler.handle(
          {
            idJeune: 'idJeune',
            accessToken: 'token'
          },
          unUtilisateurJeune()
        )

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

      it('ne récupère pas la campagne pour un bénéficiaire BRSA', async () => {
        // When
        const home = await getJeuneHomeDemarchesQueryHandler.handle(
          {
            idJeune: 'idJeune',
            accessToken: 'token'
          },
          unUtilisateurJeune({ structure: Structure.POLE_EMPLOI_BRSA })
        )

        // Then
        expect(getCampagneQueryGetter.handle).not.to.have.been.called()
        const data: Cached<JeuneHomeDemarcheQueryModel> = {
          queryModel: {
            actions: demarchesQueryModel,
            campagne: undefined
          },
          dateDuCache: undefined
        }
        expect(home).to.deep.equal(success(data))
      })
    })
  })

  describe('authorize', () => {
    it('authorize un jeune PE', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()
      // When
      await getJeuneHomeDemarchesQueryHandler.authorize(
        {
          idJeune: 'idJeune',
          accessToken: 'token'
        },
        utilisateur
      )

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        'idJeune',
        utilisateur,
        estPoleEmploi(utilisateur.structure)
      )
    })
  })
})
