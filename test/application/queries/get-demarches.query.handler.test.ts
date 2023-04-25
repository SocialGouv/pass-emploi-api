import {
  GetDemarchesQuery,
  GetDemarchesQueryHandler
} from 'src/application/queries/get-demarches.query.handler'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'
import { GetDemarchesQueryGetter } from '../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { Core } from '../../../src/domain/core'

describe('GetDemarchesQueryHandler', () => {
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let getDemarchesQueryGetter: StubbedClass<GetDemarchesQueryGetter>
  let getDemarchesQueryHandler: GetDemarchesQueryHandler

  before(() => {
    getDemarchesQueryGetter = stubClass(GetDemarchesQueryGetter)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    getDemarchesQueryHandler = new GetDemarchesQueryHandler(
      getDemarchesQueryGetter,
      jeuneAuthorizer
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
      expect(jeuneAuthorizer.authorize).to.have.been.calledWithExactly(
        query.idJeune,
        utilisateur,
        Core.structuresPoleEmploiBRSA
      )
    })
  })
})
