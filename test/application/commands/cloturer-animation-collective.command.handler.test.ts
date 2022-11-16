import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { RendezVousAuthorizer } from 'src/application/authorizers/authorize-rendezvous'
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
  failure
} from '../../../src/building-blocks/types/result'
import { RendezVous } from '../../../src/domain/rendez-vous'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { uneAnimationCollective } from '../../fixtures/rendez-vous.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('CloturerAnimationCollectiveCommandHandler', () => {
  let animationCollectiveRepository: StubbedType<RendezVous.AnimationCollective.Repository>
  let rendezVousAuthorizer = stubClass(RendezVousAuthorizer)
  let animationCollectiveFactory: StubbedClass<RendezVous.AnimationCollective.Factory>
  let animationCollectiveService: StubbedClass<RendezVous.AnimationCollective.Service>
  let cloturerAnimationCollectiveCommandHandler: CloturerAnimationCollectiveCommandHandler

  const animationCollective = uneAnimationCollective()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    animationCollectiveRepository = stubInterface(sandbox)
    rendezVousAuthorizer = stubClass(RendezVousAuthorizer)
    animationCollectiveFactory = stubClass(
      RendezVous.AnimationCollective.Factory
    )
    animationCollectiveService = stubClass(
      RendezVous.AnimationCollective.Service
    )
    cloturerAnimationCollectiveCommandHandler =
      new CloturerAnimationCollectiveCommandHandler(
        animationCollectiveRepository,
        rendezVousAuthorizer,
        animationCollectiveFactory,
        animationCollectiveService
      )
  })

  describe('handle', () => {
    it('erreur si animation collective inexistante', async () => {
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
      expect(animationCollectiveFactory.cloturer).to.have.callCount(0)
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
    it('erreur si animation collective à venir', async () => {
      // Given
      const command: CloturerAnimationCollectiveCommand = {
        idsJeunes: ['x'],
        idAnimationCollective: 'test'
      }
      animationCollectiveRepository.get
        .withArgs(command.idAnimationCollective)
        .resolves({ ...animationCollective })
      animationCollectiveService.estAVenir.returns(true)

      // When
      const result = await cloturerAnimationCollectiveCommandHandler.handle(
        command
      )
      // Then
      expect(animationCollectiveFactory.cloturer).to.have.callCount(0)
      expect(animationCollectiveRepository.save).to.have.callCount(0)
      expect(result).to.deep.equal(
        failure(new MauvaiseCommandeError('Animation Collective à venir.'))
      )
    })
    it('erreur si animation collective cloturée', async () => {
      // Given
      const command: CloturerAnimationCollectiveCommand = {
        idsJeunes: ['x'],
        idAnimationCollective: 'test'
      }
      animationCollectiveRepository.get
        .withArgs(command.idAnimationCollective)
        .resolves({ ...animationCollective, dateCloture: uneDatetime() })
      animationCollectiveService.estAVenir.returns(false)

      // When
      const result = await cloturerAnimationCollectiveCommandHandler.handle(
        command
      )
      // Then
      expect(animationCollectiveFactory.cloturer).to.have.callCount(0)
      expect(animationCollectiveRepository.save).to.have.callCount(0)
      expect(result).to.deep.equal(
        failure(
          new MauvaiseCommandeError('Animation Collective déjà cloturée.')
        )
      )
    })
    it('succes', async () => {
      // Given
      const command: CloturerAnimationCollectiveCommand = {
        idsJeunes: ['x'],
        idAnimationCollective: 'test'
      }
      animationCollectiveRepository.get
        .withArgs(command.idAnimationCollective)
        .resolves(animationCollective)
      animationCollectiveService.estAVenir.returns(false)
      const animationCollectiveCloturee = {
        ...animationCollective,
        dateCloture: uneDatetime()
      }
      animationCollectiveFactory.cloturer.returns(animationCollectiveCloturee)
      animationCollectiveRepository.save.resolves()

      // When
      const result = await cloturerAnimationCollectiveCommandHandler.handle(
        command
      )

      // Then
      expect(animationCollectiveFactory.cloturer).to.have.calledOnceWithExactly(
        animationCollective,
        command.idsJeunes
      )
      expect(
        animationCollectiveRepository.save
      ).to.have.been.calledOnceWithExactly(animationCollectiveCloturee)
      expect(result).to.deep.equal(emptySuccess())
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
      expect(rendezVousAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idAnimationCollective,
        utilisateur
      )
    })
  })
})
