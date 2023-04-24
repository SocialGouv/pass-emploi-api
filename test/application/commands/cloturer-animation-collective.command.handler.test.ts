import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { RendezVousAuthorizer } from 'src/application/authorizers/rendezvous-authorizer'
import {
  CloturerAnimationCollectiveCommand,
  CloturerAnimationCollectiveCommandHandler
} from 'src/application/commands/cloturer-animation-collective.command.handler'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { RendezVous } from '../../../src/domain/rendez-vous/rendez-vous'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { uneAnimationCollective } from '../../fixtures/rendez-vous.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('CloturerAnimationCollectiveCommandHandler', () => {
  let animationCollectiveRepository: StubbedType<RendezVous.AnimationCollective.Repository>
  let rendezVousAuthorizer = stubClass(RendezVousAuthorizer)
  let animationCollectiveService: StubbedClass<RendezVous.AnimationCollective.Service>
  let cloturerAnimationCollectiveCommandHandler: CloturerAnimationCollectiveCommandHandler

  const animationCollective = uneAnimationCollective()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    animationCollectiveRepository = stubInterface(sandbox)
    rendezVousAuthorizer = stubClass(RendezVousAuthorizer)
    animationCollectiveService = stubClass(
      RendezVous.AnimationCollective.Service
    )
    cloturerAnimationCollectiveCommandHandler =
      new CloturerAnimationCollectiveCommandHandler(
        animationCollectiveRepository,
        rendezVousAuthorizer,
        animationCollectiveService
      )
  })

  describe('handle', () => {
    describe("quand l'animation collective n'existe pas", () => {
      it('retourne une failure', async () => {
        // Given
        const command: CloturerAnimationCollectiveCommand = {
          idsJeunes: ['x'],
          idAnimationCollective: 'test'
        }
        animationCollectiveRepository.get
          .withArgs(command.idAnimationCollective)
          .resolves(undefined)
        // When
        const result = await cloturerAnimationCollectiveCommandHandler.handle(
          command
        )
        // Then
        expect(animationCollectiveService.cloturer).to.have.callCount(0)
        expect(animationCollectiveRepository.save).to.have.callCount(0)
        expect(result).to.deep.equal(
          failure(
            new NonTrouveError(
              'Animation Collective',
              command.idAnimationCollective
            )
          )
        )
      })
    })

    describe('quand la cloture est impossible', () => {
      it('renvoie une failure', async () => {
        // Given
        const command: CloturerAnimationCollectiveCommand = {
          idsJeunes: ['x'],
          idAnimationCollective: 'test'
        }
        animationCollectiveRepository.get
          .withArgs(command.idAnimationCollective)
          .resolves({ ...animationCollective, dateCloture: uneDatetime() })

        animationCollectiveService.cloturer.returns(
          failure(
            new MauvaiseCommandeError('Animation Collective déjà cloturée.')
          )
        )

        // When
        const result = await cloturerAnimationCollectiveCommandHandler.handle(
          command
        )
        // Then
        expect(animationCollectiveRepository.save).to.have.callCount(0)
        expect(result).to.deep.equal(
          failure(
            new MauvaiseCommandeError('Animation Collective déjà cloturée.')
          )
        )
      })
    })

    describe('quand la cloture fonctionne', () => {
      it('renvoie un succès', async () => {
        // Given
        const command: CloturerAnimationCollectiveCommand = {
          idsJeunes: ['x'],
          idAnimationCollective: 'test'
        }
        animationCollectiveRepository.get
          .withArgs(command.idAnimationCollective)
          .resolves(animationCollective)
        const animationCollectiveCloturee = {
          ...animationCollective,
          dateCloture: uneDatetime()
        }
        animationCollectiveService.cloturer.returns(
          success(animationCollectiveCloturee)
        )

        // When
        const result = await cloturerAnimationCollectiveCommandHandler.handle(
          command
        )

        // Then
        expect(
          animationCollectiveRepository.save
        ).to.have.been.calledOnceWithExactly(animationCollectiveCloturee)
        expect(result).to.deep.equal(emptySuccess())
      })
    })
  })

  describe('authorize', () => {
    it('authorise un conseiller', async () => {
      // Given
      const command: CloturerAnimationCollectiveCommand = {
        idsJeunes: ['x'],
        idAnimationCollective: animationCollective.id
      }

      const utilisateur = unUtilisateurConseiller()

      // When
      await cloturerAnimationCollectiveCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(
        rendezVousAuthorizer.autoriserConseillerPourUnRendezVousAvecAuMoinsUnJeune
      ).to.have.been.calledWithExactly(
        command.idAnimationCollective,
        utilisateur
      )
    })
  })
})
