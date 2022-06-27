import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { Action } from 'src/domain/action'
import { ActionAuthorizer } from '../../../src/application/authorizers/authorize-action'
import { uneAction } from '../../fixtures/action.fixture'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { createSandbox, expect } from '../../utils'

describe('ActionAuthorizer', () => {
  let actionRepository: StubbedType<Action.Repository>
  let actionAuthorizer: ActionAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    actionRepository = stubInterface(sandbox)
    actionAuthorizer = new ActionAuthorizer(actionRepository)
  })

  describe('authorize', () => {
    describe("quand c'est un jeune et que l'action est à lui", () => {
      it('retourne un success', async () => {
        // Given
        const idAction = 'idAction'
        const utilisateur = unUtilisateurJeune()
        const conseillerEtJeune = { idConseiller: '', idJeune: utilisateur.id }
        actionRepository.getConseillerEtJeune
          .withArgs(idAction)
          .resolves(conseillerEtJeune)

        // When
        const result = await actionAuthorizer.authorize(idAction, utilisateur)

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe("quand c'est un conseiller et que l'action est à lui", () => {
      it('retourne un success', async () => {
        // Given
        const idAction = 'idAction'
        const utilisateur = unUtilisateurConseiller()
        const conseillerEtJeune = { idConseiller: utilisateur.id, idJeune: '' }
        actionRepository.getConseillerEtJeune
          .withArgs(idAction)
          .resolves(conseillerEtJeune)

        // When
        const result = await actionAuthorizer.authorize(idAction, utilisateur)

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe("quand c'est un jeune et que l'action n'est pas à lui", () => {
      it('retourne une failure', async () => {
        // Given
        const idAction = 'idAction'
        const utilisateur = unUtilisateurJeune()
        const action = uneAction({ idJeune: 'un autre jeune' })
        actionRepository.getConseillerEtJeune
          .withArgs(idAction)
          .resolves(action)

        // When
        const result = await actionAuthorizer.authorize(idAction, utilisateur)

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
    describe("quand c'est un conseiller et que l'action n'est pas à lui", () => {
      it('retourne une failure', async () => {
        // Given
        const idAction = 'idAction'
        const utilisateur = unUtilisateurConseiller()
        actionRepository.getConseillerEtJeune
          .withArgs(idAction)
          .resolves({ idConseiller: 'un autre conseiller' })

        // When
        const result = await actionAuthorizer.authorize(idAction, utilisateur)

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
    describe("quand l'action n'existe pas", () => {
      it('retourne une failure', async () => {
        // Given
        const idAction = 'idAction'
        const utilisateur = unUtilisateurConseiller()
        actionRepository.get.withArgs(idAction).resolves(undefined)

        // When
        const result = await actionAuthorizer.authorize(idAction, utilisateur)

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })
})
