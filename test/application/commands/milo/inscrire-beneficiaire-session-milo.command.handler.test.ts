import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import InscrireBeneficiaireSessionMiloCommandHandler, {
  InscrireBeneficiaireSessionMiloCommand
} from 'src/application/commands/milo/inscrire-beneficiaire-session-milo.command.handler'
import {
  MauvaiseCommandeError,
  NonTraitableError,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Failure,
  isFailure,
  success
} from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Chat } from 'src/domain/chat'
import { Core } from 'src/domain/core'
import { JeuneMilo } from 'src/domain/milo/jeune.milo'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { ChatCryptoService } from 'src/utils/chat-crypto-service'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from 'test/utils'

describe('InscrireBeneficiaireSessionMiloCommandHandler', () => {
  describe('.handle', () => {
    const beneficiaireMilo: JeuneMilo = {
      ...unJeune(),
      idStructureMilo: 'id-structure-milo'
    }

    const command: InscrireBeneficiaireSessionMiloCommand = {
      idSession: 'id-session',
      idBeneficiaire: beneficiaireMilo.id,
      accessToken: 'accessToken'
    }

    let beneficiaireMiloRepository: StubbedType<JeuneMilo.Repository>
    let authentificationRepository: StubbedType<Authentification.Repository>
    let sessionMiloRepository: StubbedType<SessionMilo.Repository>
    let chatRepository: StubbedType<Chat.Repository>
    let chatCryptoService: StubbedClass<ChatCryptoService>
    let commandHandler: InscrireBeneficiaireSessionMiloCommandHandler

    beforeEach(async () => {
      const sandbox: SinonSandbox = createSandbox()
      beneficiaireMiloRepository = stubInterface(sandbox)
      authentificationRepository = stubInterface(sandbox)
      sessionMiloRepository = stubInterface(sandbox)
      chatRepository = stubInterface(sandbox)
      chatCryptoService = stubClass(ChatCryptoService)
      commandHandler = new InscrireBeneficiaireSessionMiloCommandHandler(
        beneficiaireMiloRepository,
        authentificationRepository,
        sessionMiloRepository,
        chatRepository,
        chatCryptoService
      )

      beneficiaireMiloRepository.get
        .withArgs(beneficiaireMilo.id)
        .resolves(success(beneficiaireMilo))
      authentificationRepository.exchangeToken
        .withArgs('accessToken', Core.Structure.MILO)
        .resolves('token-beneficiaire-milo')
      authentificationRepository.disguiseBeneficiaireAsConseiller
        .withArgs(beneficiaireMilo.conseiller!.id, 'accessToken')
        .resolves('token-conseiller-milo')
      sessionMiloRepository.peutInscrireBeneficiaire
        .withArgs('id-session', 'token-beneficiaire-milo')
        .resolves(emptySuccess())
      sessionMiloRepository.inscrireBeneficiaire
        .withArgs(
          'id-session',
          beneficiaireMilo.idPartenaire,
          'token-conseiller-milo'
        )
        .resolves(emptySuccess())
      chatRepository.recupererConversationIndividuelle
        .withArgs(beneficiaireMilo.id)
        .resolves({ id: 'id-chat', idBeneficiaire: beneficiaireMilo.id })
      chatCryptoService.encrypt.callsFake(message => ({
        encryptedText: 'ENCRYPTED ' + message,
        iv: 'IV ' + message
      }))
    })

    it('inscrit le bénéficiaire en se faisant passer pour le conseiller', async () => {
      // When
      await commandHandler.handle(command)

      // Then
      expect(
        sessionMiloRepository.inscrireBeneficiaire
      ).to.have.been.calledOnceWithExactly(
        'id-session',
        beneficiaireMilo.idPartenaire,
        'token-conseiller-milo'
      )
    })

    it('prévient le conseiller par chat', async () => {
      // When
      await commandHandler.handle(command)

      // Then
      expect(
        chatRepository.envoyerMessageIndividuel
      ).to.have.been.calledOnceWithExactly(
        'id-chat',
        {
          message:
            'ENCRYPTED Votre bénéficiaire s’est inscrit à l’événement suivant',
          iv: 'IV Votre bénéficiaire s’est inscrit à l’événement suivant',
          idConseiller: '1',
          type: 'AUTO_INSCRIPTION'
        },
        { sentByBeneficiaire: true }
      )
    })

    it('vérifie que le bénéficiaire existe', async () => {
      // Given
      beneficiaireMiloRepository.get
        .withArgs(beneficiaireMilo.id)
        .resolves(failure(new NonTrouveError('jeune', beneficiaireMilo.id)))

      // When
      const result = await commandHandler.handle(command)

      // Then
      expect(isFailure(result)).to.be.true()
      expect((result as Failure).error).to.be.an.instanceOf(NonTrouveError)
    })

    it('vérifie que le conseiller existe', async () => {
      // Given
      beneficiaireMiloRepository.get
        .withArgs(beneficiaireMilo.id)
        .resolves(success({ ...beneficiaireMilo, conseiller: undefined }))

      // When
      const result = await commandHandler.handle(command)

      // Then
      expect(isFailure(result)).to.be.true()
      expect((result as Failure).error).to.be.an.instanceOf(NonTraitableError)
    })

    it('vérifie que le bénéficiaire peut s’inscrire', async () => {
      // Given
      sessionMiloRepository.peutInscrireBeneficiaire
        .withArgs('id-session', 'token-beneficiaire-milo')
        .resolves(failure(new MauvaiseCommandeError('Erreur')))

      // When
      const result = await commandHandler.handle(command)

      // Then
      expect(isFailure(result)).to.be.true()
      expect((result as Failure).error).to.be.an.instanceOf(
        MauvaiseCommandeError
      )
    })

    it('vérifie que la conversation existe', async () => {
      // Given
      chatRepository.recupererConversationIndividuelle
        .withArgs(beneficiaireMilo.id)
        .resolves(undefined)

      // When
      await commandHandler.handle(command)

      // Then
      expect(chatRepository.envoyerMessageIndividuel).not.to.have.been.called()
    })
  })
})
