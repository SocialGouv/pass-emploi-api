import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { RendezVousAuthorizer } from 'src/application/authorizers/rendezvous-authorizer'

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
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import {
  CloreRendezVousCommand,
  CloreRendezVousCommandHandler
} from '../../../src/application/commands/clore-rendez-vous.command.handler'

describe('CloreRendezVousCommandHandler', () => {
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let rendezVousAuthorizer = stubClass(RendezVousAuthorizer)
  let rendezVousFactory: StubbedClass<RendezVous.Factory>
  let cloreRendezVousCommandHandler: CloreRendezVousCommandHandler

  const rendezVous = unRendezVous()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    rendezVousAuthorizer = stubClass(RendezVousAuthorizer)
    rendezVousFactory = stubClass(RendezVous.Factory)
    cloreRendezVousCommandHandler = new CloreRendezVousCommandHandler(
      rendezVousRepository,
      rendezVousAuthorizer,
      rendezVousFactory
    )
  })

  describe('handle', () => {
    describe("quand le rendez Vous n'existe pas", () => {
      it('retourne une failure', async () => {
        // Given
        const command: CloreRendezVousCommand = {
          idRendezVous: 'test',
          idsJeunesPresents: ['test']
        }
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(undefined)
        // When
        const result = await cloreRendezVousCommandHandler.handle(command)
        // Then
        expect(rendezVousFactory.clore).to.have.callCount(0)
        expect(rendezVousRepository.save).to.have.callCount(0)
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Rendez-Vous', command.idRendezVous))
        )
      })
    })

    describe('quand la cloture est impossible', () => {
      it('renvoie une failure', async () => {
        // Given
        const command: CloreRendezVousCommand = {
          idsJeunesPresents: ['test'],
          idRendezVous: 'test'
        }
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves({ ...rendezVous, dateCloture: uneDatetime() })

        rendezVousFactory.clore.returns(
          failure(new MauvaiseCommandeError('Le rendez-vous est déjà clos.'))
        )

        // When
        const result = await cloreRendezVousCommandHandler.handle(command)
        // Then
        expect(rendezVousRepository.save).to.have.callCount(0)
        expect(result).to.deep.equal(
          failure(new MauvaiseCommandeError('Le rendez-vous est déjà clos.'))
        )
      })
    })

    describe('quand la cloture fonctionne', () => {
      it('renvoie un succès', async () => {
        // Given
        const command: CloreRendezVousCommand = {
          idsJeunesPresents: ['test'],
          idRendezVous: 'test'
        }
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVous)
        const rendezVousCloturee = {
          ...rendezVous,
          dateCloture: uneDatetime()
        }
        rendezVousFactory.clore.returns(success(rendezVousCloturee))

        // When
        const result = await cloreRendezVousCommandHandler.handle(command)

        // Then
        expect(rendezVousRepository.save).to.have.been.calledOnceWithExactly(
          rendezVousCloturee
        )
        expect(result).to.deep.equal(emptySuccess())
      })
    })
  })

  describe('authorize', () => {
    it('authorise un conseiller', async () => {
      // Given
      const command: CloreRendezVousCommand = {
        idsJeunesPresents: ['test'],
        idRendezVous: rendezVous.id
      }

      const utilisateur = unUtilisateurConseiller()

      // When
      await cloreRendezVousCommandHandler.authorize(command, utilisateur)

      // Then
      expect(
        rendezVousAuthorizer.autoriserConseillerPourUnRendezVousAvecAuMoinsUnJeune
      ).to.have.been.calledWithExactly(command.idRendezVous, utilisateur)
    })
  })
})
