import { GetDemarchesConseillerQueryHandler } from 'src/application/queries/get-demarches-conseiller.query.handler'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import { GetDemarchesQueryGetter } from '../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { estFranceTravail } from '../../../src/domain/core'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { StubbedClass, expect, stubClass } from '../../utils'
import { uneDemarcheQueryModel } from '../../fixtures/query-models/demarche.query-model.fixtures'
import { success } from '../../../src/building-blocks/types/result'

describe('GetDemarchesConseillerQueryHandler', () => {
  let authorizer: StubbedClass<ConseillerAuthorizer>
  let getDemarchesQueryGetter: StubbedClass<GetDemarchesQueryGetter>
  let getDemarchesConseillerQueryHandler: GetDemarchesConseillerQueryHandler

  before(() => {
    getDemarchesQueryGetter = stubClass(GetDemarchesQueryGetter)
    authorizer = stubClass(ConseillerAuthorizer)

    getDemarchesConseillerQueryHandler = new GetDemarchesConseillerQueryHandler(
      getDemarchesQueryGetter,
      authorizer
    )
  })

  describe('handle', () => {
    it('retourne le résultat du DemarcheQueryGetter', async () => {
      // Given
      const query = {
        idConseiller: 'idConseiller',
        idJeune: 'id-jeune',
        accessToken: 'token'
      }

      getDemarchesQueryGetter.handle.resolves(
        success({ queryModel: [uneDemarcheQueryModel()] })
      )

      // When
      const result = await getDemarchesConseillerQueryHandler.handle(query)

      // Then
      expect(result).to.deep.equal(
        success({
          queryModel: [uneDemarcheQueryModel()]
        })
      )
      expect(getDemarchesQueryGetter.handle).to.have.been.calledOnceWithExactly(
        {
          idJeune: 'id-jeune',
          accessToken: 'token',
          tri: GetDemarchesQueryGetter.Tri.parSatutEtDateFin,
          dateDebut: undefined,
          pourConseiller: true
        }
      )
    })
  })

  describe('authorize', () => {
    it('authorise le conseiller pour son jeune', async () => {
      // Given
      const query = {
        idConseiller: 'ABCDE',
        idJeune: 'ABCDE',
        accessToken: 'token'
      }
      const utilisateur = unUtilisateurJeune()

      // When
      await getDemarchesConseillerQueryHandler.authorize(query, utilisateur)
      // Then
      expect(
        authorizer.autoriserLeConseillerPourSonJeune
      ).to.have.been.calledWithExactly(
        query.idConseiller,
        query.idJeune,
        utilisateur,
        estFranceTravail(utilisateur.structure)
      )
    })
  })
})
