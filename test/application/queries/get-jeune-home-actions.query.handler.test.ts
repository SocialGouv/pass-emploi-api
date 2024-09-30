import { success } from 'src/building-blocks/types/result'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import {
  ActionsJeuneQueryModel,
  GetActionsJeuneQueryHandler
} from '../../../src/application/queries/action/get-actions-jeune.query.handler.db'
import { GetJeuneHomeActionsQueryHandler } from '../../../src/application/queries/get-jeune-home-actions.query.handler'
import { GetCampagneQueryGetter } from '../../../src/application/queries/query-getters/get-campagne.query.getter'
import { Core } from '../../../src/domain/core'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneCampagneQueryModel } from '../../fixtures/campagne.fixture'
import { uneActionQueryModelFromDomain } from '../../fixtures/query-models/action.query-model.fixtures'
import { expect, StubbedClass, stubClass } from '../../utils'
import Structure = Core.Structure

describe('GetJeuneHomeActionsQueryHandler', () => {
  let getActionsByJeuneQueryHandler: StubbedClass<GetActionsJeuneQueryHandler>
  let getCampagneQueryGetter: StubbedClass<GetCampagneQueryGetter>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let getJeuneHomeActionsQueryHandler: GetJeuneHomeActionsQueryHandler

  const campagneQueryModel = uneCampagneQueryModel()
  const actionsQueryModel = [uneActionQueryModelFromDomain()]

  beforeEach(() => {
    getActionsByJeuneQueryHandler = stubClass(GetActionsJeuneQueryHandler)
    getCampagneQueryGetter = stubClass(GetCampagneQueryGetter)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    getJeuneHomeActionsQueryHandler = new GetJeuneHomeActionsQueryHandler(
      getActionsByJeuneQueryHandler,
      getCampagneQueryGetter,
      jeuneAuthorizer
    )
  })

  describe('handle', () => {
    beforeEach(async () => {
      // Given
      const actionsByJeuneOutput: ActionsJeuneQueryModel = {
        actions: actionsQueryModel,
        metadonnees: {
          nombreTotal: 5,
          nombreFiltrees: 5,
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

      getCampagneQueryGetter.handle
        .withArgs({ idJeune: 'idJeune' })
        .resolves(campagneQueryModel)
    })

    it('appelle les actions et la campagne en cours et les retourne', async () => {
      // When
      const home = await getJeuneHomeActionsQueryHandler.handle(
        {
          idJeune: 'idJeune'
        },
        unUtilisateurJeune()
      )

      // Then
      expect(home).to.deep.equal({
        actions: actionsQueryModel,
        campagne: campagneQueryModel
      })
    })

    it('ne récupère pas la campagne en cours pour un bénéficiaire AIJ', async () => {
      // When
      const home = await getJeuneHomeActionsQueryHandler.handle(
        {
          idJeune: 'idJeune'
        },
        unUtilisateurJeune({ structure: Structure.POLE_EMPLOI_AIJ })
      )

      // Then
      expect(getCampagneQueryGetter.handle).not.to.have.been.called()
      expect(home).to.deep.equal({
        actions: actionsQueryModel,
        campagne: undefined
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
