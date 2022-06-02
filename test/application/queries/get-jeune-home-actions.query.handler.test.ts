import { expect, StubbedClass, stubClass } from '../../utils'
import { GetActionsByJeuneQueryHandler } from '../../../src/application/queries/get-actions-by-jeune.query.handler.db'
import { GetCampagneQueryModel } from '../../../src/application/queries/query-getters/get-campagne.query.getter'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { GetJeuneHomeActionsQueryHandler } from '../../../src/application/queries/get-jeune-home-actions.query.handler'
import { uneActionQueryModelFromDomain } from '../../fixtures/query-models/action.query-model.fixtures'
import { uneCampagneQueryModel } from '../../fixtures/campagne.fixture'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'

describe('GetJeuneHomeActionsQueryHandler', () => {
  let getActionsByJeuneQueryHandler: StubbedClass<GetActionsByJeuneQueryHandler>
  let getCampagneQueryModel: StubbedClass<GetCampagneQueryModel>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let getJeuneHomeActionsQueryHandler: GetJeuneHomeActionsQueryHandler

  const campagneQueryModel = uneCampagneQueryModel()
  const actionsQueryModel = [uneActionQueryModelFromDomain()]

  beforeEach(() => {
    getActionsByJeuneQueryHandler = stubClass(GetActionsByJeuneQueryHandler)
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
      getActionsByJeuneQueryHandler.handle
        .withArgs({ idJeune: 'idJeune' })
        .resolves(actionsQueryModel)

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
      expect(jeuneAuthorizer.authorize).to.have.been.calledWithExactly(
        'idJeune',
        unUtilisateurJeune()
      )
    })
  })
})
