import { expect, StubbedClass, stubClass } from '../../utils'
import {
  ActionsJeuneQueryModel,
  GetActionsJeuneQueryHandler
} from '../../../src/application/queries/action/get-actions-jeune.query.handler.db'
import { GetCampagneQueryModel } from '../../../src/application/queries/query-getters/get-campagne.query.getter'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { GetJeuneHomeActionsQueryHandler } from '../../../src/application/queries/get-jeune-home-actions.query.handler'
import { uneActionQueryModelFromDomain } from '../../fixtures/query-models/action.query-model.fixtures'
import { uneCampagneQueryModel } from '../../fixtures/campagne.fixture'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { success } from 'src/building-blocks/types/result'

describe('GetJeuneHomeActionsQueryHandler', () => {
  let getActionsByJeuneQueryHandler: StubbedClass<GetActionsJeuneQueryHandler>
  let getCampagneQueryModel: StubbedClass<GetCampagneQueryModel>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let getJeuneHomeActionsQueryHandler: GetJeuneHomeActionsQueryHandler

  const campagneQueryModel = uneCampagneQueryModel()
  const actionsQueryModel = [uneActionQueryModelFromDomain()]

  beforeEach(() => {
    getActionsByJeuneQueryHandler = stubClass(GetActionsJeuneQueryHandler)
    getCampagneQueryModel = stubClass(GetCampagneQueryModel)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    getJeuneHomeActionsQueryHandler = new GetJeuneHomeActionsQueryHandler(
      getActionsByJeuneQueryHandler,
      getCampagneQueryModel,
      jeuneAuthorizer
    )
  })

  describe('handle', () => {
    it('appelle les actions et campagne et les retourne', async () => {
      // Given
      const actionsByJeuneOutput: ActionsJeuneQueryModel = {
        actions: actionsQueryModel,
        metadonnees: {
          nombreTotal: 5,
          nombreEnCours: 2,
          nombreTerminees: 1,
          nombreAnnulees: 1,
          nombrePasCommencees: 1,
          nombreNonQualifiables: 4,
          nombreAQualifier: 1,
          nombreQualifiees: 0,
          nombreActionsParPage: 10
        }
      }
      getActionsByJeuneQueryHandler.handle
        .withArgs({ idJeune: 'idJeune' })
        .resolves(success(actionsByJeuneOutput))

      getCampagneQueryModel.handle
        .withArgs({ idJeune: 'idJeune' })
        .resolves(campagneQueryModel)

      // When
      const home = await getJeuneHomeActionsQueryHandler.handle({
        idJeune: 'idJeune'
      })

      // Then
      expect(home).to.deep.equal({
        actions: actionsQueryModel,
        campagne: campagneQueryModel
      })
    })
  })

  describe('authorize', () => {
    it('autorise un jeune', async () => {
      // When
      await getJeuneHomeActionsQueryHandler.authorize(
        { idJeune: 'idJeune' },
        unUtilisateurJeune()
      )

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        'idJeune',
        unUtilisateurJeune()
      )
    })
  })
})
