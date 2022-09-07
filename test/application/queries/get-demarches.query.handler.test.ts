import {
  GetDemarchesQuery,
  GetDemarchesQueryHandler
} from 'src/application/queries/get-demarches.query.handler'
import { JeunePoleEmploiAuthorizer } from '../../../src/application/authorizers/authorize-jeune-pole-emploi'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'
import { GetDemarchesQueryGetter } from '../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'

describe('GetDemarchesQueryHandler', () => {
  let jeunePoleEmploiAuthorizer: StubbedClass<JeunePoleEmploiAuthorizer>
  let getDemarchesQueryGetter: StubbedClass<GetDemarchesQueryGetter>
  let getDemarchesQueryHandler: GetDemarchesQueryHandler

  before(() => {
    getDemarchesQueryGetter = stubClass(GetDemarchesQueryGetter)
    jeunePoleEmploiAuthorizer = stubClass(JeunePoleEmploiAuthorizer)

    getDemarchesQueryHandler = new GetDemarchesQueryHandler(
      getDemarchesQueryGetter,
      jeunePoleEmploiAuthorizer
    )
  })

  describe('handle', () => {
    it('retourne le résultat du DemarcheQueryGetter', () => {
      // When
      getDemarchesQueryHandler.handle({
        idJeune: 'idJeune',
        accessToken: 'token'
      })

      // Then
      expect(getDemarchesQueryGetter.handle).to.have.been.calledWith({
        idJeune: 'idJeune',
        accessToken: 'token',
        tri: GetDemarchesQueryGetter.Tri.parSatutEtDateFin
      })
    })
  })

  describe('authorize', () => {
    it('authorise le jeune', async () => {
      // Given
      const query: GetDemarchesQuery = {
        idJeune: 'ABCDE',
        accessToken: 'token'
      }
      const utilisateur = unUtilisateurJeune()

      // When
      await getDemarchesQueryHandler.authorize(query, utilisateur)
      // Then
      expect(jeunePoleEmploiAuthorizer.authorize).to.have.been.calledWith(
        query.idJeune,
        utilisateur
      )
    })
  })
})
