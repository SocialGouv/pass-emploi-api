import { Conseiller } from '../../../src/domain/conseiller/conseiller'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { expect, StubbedClass, stubClass } from '../../utils'
import { AuthorizeConseillerForJeunesTransferesTemporairement } from '../../../src/application/authorizers/authorize-conseiller-for-jeunes-transferes'
import { AuthorizeListeDeDiffusion } from '../../../src/application/authorizers/authorize-liste-de-diffusion'
import {
  UpdateListeDeDiffusionCommand,
  UpdateListeDeDiffusionCommandHandler
} from '../../../src/application/commands/update-liste-de-diffusion.command.handler'
import { createSandbox } from 'sinon'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import {
  emptySuccess,
  failure,
  isSuccess
} from '../../../src/building-blocks/types/result'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { uneListeDeDiffusion } from '../../fixtures/liste-de-diffusion.fixture'
import ListeDeDiffusion = Conseiller.ListeDeDiffusion

describe('UpdateListeDeDiffusionCommandHandler', () => {
  let listeDeDiffusionRepository: StubbedType<Conseiller.ListeDeDiffusion.Repository>
  let listeDeDiffusionService: StubbedClass<Conseiller.ListeDeDiffusion.Service>
  let authorizerJeunes: StubbedClass<AuthorizeConseillerForJeunesTransferesTemporairement>
  let authorizerListe: StubbedClass<AuthorizeListeDeDiffusion>
  let handler: UpdateListeDeDiffusionCommandHandler

  beforeEach(() => {
    listeDeDiffusionRepository = stubInterface(createSandbox())
    listeDeDiffusionService = stubClass(Conseiller.ListeDeDiffusion.Service)
    authorizerJeunes = stubClass(
      AuthorizeConseillerForJeunesTransferesTemporairement
    )
    authorizerListe = stubClass(AuthorizeListeDeDiffusion)
    handler = new UpdateListeDeDiffusionCommandHandler(
      authorizerJeunes,
      authorizerListe,
      listeDeDiffusionRepository,
      listeDeDiffusionService
    )
  })

  describe('handle', () => {
    const command: UpdateListeDeDiffusionCommand = {
      id: 'liste-id',
      titre: 'liste-titre',
      idsBeneficiaires: ['1']
    }

    describe("quand la liste n'existe pas", () => {
      it('retourne une failure', async () => {
        // Given
        listeDeDiffusionRepository.get.withArgs('liste-id').resolves(undefined)

        // When
        const result = await handler.handle(command)

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('ListeDeDiffusion'))
        )
      })
    })

    describe('quand la liste existe', () => {
      it('met à jour la liste', async () => {
        // Given
        const listeDeDiffusionInitiale = uneListeDeDiffusion()
        listeDeDiffusionRepository.get
          .withArgs('liste-id')
          .resolves(listeDeDiffusionInitiale)

        const listeDeDiffusionMiseAJour: ListeDeDiffusion = {
          ...listeDeDiffusionInitiale,
          titre: 'nouveau-titre'
        }
        listeDeDiffusionService.mettreAJour
          .withArgs(listeDeDiffusionInitiale, {
            titre: command.titre,
            idsBeneficiaires: command.idsBeneficiaires
          })
          .returns(listeDeDiffusionMiseAJour)

        // When
        const result = await handler.handle(command)

        // Then
        expect(isSuccess(result)).to.be.true()
        expect(listeDeDiffusionRepository.save).to.have.been.calledWith(
          listeDeDiffusionMiseAJour
        )
      })
    })
  })

  describe('authorize', () => {
    it('authorize un conseiller pour ses jeunes sur une liste', async () => {
      // Given
      const command: UpdateListeDeDiffusionCommand = {
        id: 'liste-id',
        titre: 'liste-titre',
        idsBeneficiaires: ['1']
      }
      const utilisateur = unUtilisateurConseiller()
      authorizerJeunes.authorize
        .withArgs(command.idsBeneficiaires, utilisateur)
        .resolves(emptySuccess())
      authorizerListe.authorize
        .withArgs(command.id, utilisateur)
        .resolves(emptySuccess())

      // When
      const result = await handler.authorize(command, utilisateur)

      // Then
      expect(isSuccess(result)).to.be.true()
    })
  })
})
