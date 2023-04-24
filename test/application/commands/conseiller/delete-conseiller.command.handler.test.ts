import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../../src/application/authorizers/conseiller-authorizer'
import {
  DeleteConseillerCommand,
  DeleteConseillerCommandHandler
} from '../../../../src/application/commands/conseiller/delete-conseiller.command.handler'
import {
  DroitsInsuffisants,
  MauvaiseCommandeError
} from '../../../../src/building-blocks/types/domain-error'
import { failure } from '../../../../src/building-blocks/types/result'
import { Authentification } from '../../../../src/domain/authentification'
import { Conseiller } from '../../../../src/domain/conseiller/conseiller'
import { Core } from '../../../../src/domain/core'
import { Evenement, EvenementService } from '../../../../src/domain/evenement'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { unUtilisateurConseiller } from '../../../fixtures/authentification.fixture'
import { StubbedClass, expect, stubClass } from '../../../utils'
import { unConseiller } from '../../../fixtures/conseiller.fixture'
import { unJeune } from '../../../fixtures/jeune.fixture'

describe('DeleteConseillerCommandHandler', () => {
  let deleteConseillerCommandHandler: DeleteConseillerCommandHandler
  let jeuneRepository: StubbedType<Jeune.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let authentificationRepository: StubbedType<Authentification.Repository>
  let evenementService: StubbedClass<EvenementService>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>

  beforeEach(() => {
    const sandbox = createSandbox()
    conseillerRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    authentificationRepository = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    deleteConseillerCommandHandler = new DeleteConseillerCommandHandler(
      conseillerRepository,
      jeuneRepository,
      authentificationRepository,
      evenementService,
      conseillerAuthorizer
    )
  })

  describe('authorize', () => {
    it('autorise un conseiller pour son jeune', async () => {
      // Given
      const command: DeleteConseillerCommand = {
        idConseiller: 'idConseiller'
      }
      // When
      await deleteConseillerCommandHandler.authorize(
        command,
        unUtilisateurConseiller({ structure: Core.Structure.POLE_EMPLOI_BRSA })
      )

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(
        'idConseiller',
        unUtilisateurConseiller({ structure: Core.Structure.POLE_EMPLOI_BRSA })
      )
    })
    it("n'autorise pas un conseiller non PE", async () => {
      // Given
      const command: DeleteConseillerCommand = {
        idConseiller: 'idConseiller'
      }
      // When
      const result = await deleteConseillerCommandHandler.authorize(
        command,
        unUtilisateurConseiller({ structure: Core.Structure.MILO })
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })

  describe('handle', () => {
    describe('quand le conseiller existe', async () => {
      const command: DeleteConseillerCommand = {
        idConseiller: 'idConseiller'
      }
      conseillerRepository.get
        .withArgs(command.idConseiller)
        .resolves(unConseiller())

      it('echec quand son portefeuille est non vide', async () => {
        jeuneRepository.findAllJeunesByConseiller
          .withArgs(command.idConseiller)
          .resolves([unJeune()])

        // When
        const result = await deleteConseillerCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(
          failure(
            new MauvaiseCommandeError(
              'Le conseiller doit avoir un portefeuille vide'
            )
          )
        )
      })

      it('supprime le conseiller', async () => {
        jeuneRepository.findAllJeunesByConseiller
          .withArgs(command.idConseiller)
          .resolves([])

        // When
        await deleteConseillerCommandHandler.handle(command)

        //Then
        expect(
          authentificationRepository.deleteUtilisateurIdp
        ).to.have.been.calledOnceWithExactly(command.idConseiller)
        expect(conseillerRepository.delete).to.have.been.calledOnceWithExactly(
          command.idConseiller
        )
      })
    })
  })

  describe('monitor', () => {
    it("envoie l'evenement de suppression", () => {
      // When
      deleteConseillerCommandHandler.monitor(unUtilisateurConseiller())

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.COMPTE_SUPPRIME,
        unUtilisateurConseiller()
      )
    })
  })
})
