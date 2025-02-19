import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import AutoinscrireBeneficiaireSessionMiloCommandHandler, {
  AutoinscrireBeneficiaireSessionMiloCommand
} from 'src/application/commands/milo/autoinscrire-beneficiaire-session-milo.command.handler'
import {
  DroitsInsuffisants,
  NombrePlacesInsuffisantError,
  NonTraitableError,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import {
  emptySuccess,
  Failure,
  isFailure,
  isSuccess,
  success
} from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Chat } from 'src/domain/chat'
import { Core } from 'src/domain/core'
import { EvenementService } from 'src/domain/evenement'
import { JeuneMilo } from 'src/domain/milo/jeune.milo'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { Notification } from 'src/domain/notification/notification'
import { ChatCryptoService } from 'src/utils/chat-crypto-service'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from 'test/fixtures/authentification.fixture'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { uneSessionMiloAllegee } from 'test/fixtures/sessions.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from 'test/utils'

describe('AutoinscrireBeneficiaireSessionMiloCommandHandler', () => {
  let beneficiaireMiloRepository: StubbedType<JeuneMilo.Repository>
  let authentificationRepository: StubbedType<Authentification.Repository>
  let sessionMiloRepository: StubbedType<SessionMilo.Repository>
  let chatRepository: StubbedType<Chat.Repository>
  let chatCryptoService: StubbedClass<ChatCryptoService>
  let notificationService: StubbedClass<Notification.Service>
  let evenementService: StubbedClass<EvenementService>
  let commandHandler: AutoinscrireBeneficiaireSessionMiloCommandHandler

  const beneficiaireMilo: JeuneMilo = {
    ...unJeune(),
    idStructureMilo: 'id-structure-milo'
  }
  const utilisateurBeneficiaire = unUtilisateurJeune({
    id: beneficiaireMilo.id
  })
  const session = uneSessionMiloAllegee()
  const command: AutoinscrireBeneficiaireSessionMiloCommand = {
    idSession: 'id-session',
    idBeneficiaire: beneficiaireMilo.id,
    accessToken: 'accessToken'
  }

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    beneficiaireMiloRepository = stubInterface(sandbox)
    authentificationRepository = stubInterface(sandbox)
    sessionMiloRepository = stubInterface(sandbox)
    chatRepository = stubInterface(sandbox)
    chatCryptoService = stubClass(ChatCryptoService)
    notificationService = stubClass(Notification.Service)
    evenementService = stubClass(EvenementService)
    commandHandler = new AutoinscrireBeneficiaireSessionMiloCommandHandler(
      beneficiaireMiloRepository,
      authentificationRepository,
      sessionMiloRepository,
      chatRepository,
      chatCryptoService,
      notificationService,
      evenementService
    )
  })

  describe('.getAggregate', () => {
    it('renvoie le bénéficiaire MILO', async () => {
      // Given
      beneficiaireMiloRepository.get
        .withArgs(beneficiaireMilo.id)
        .resolves(success(beneficiaireMilo))

      // When
      const aggregate = await commandHandler.getAggregate(command)

      // Then
      expect(aggregate).to.equal(beneficiaireMilo)
    })

    it('renvoie undefined si le bénéficiaire n’existe pas', async () => {
      // Given
      beneficiaireMiloRepository.get
        .withArgs(beneficiaireMilo.id)
        .resolves(new NonTrouveError('Jeune', beneficiaireMilo.id))

      // When
      const aggregate = await commandHandler.getAggregate(command)

      // Then
      expect(aggregate).to.be.undefined()
    })
  })

  describe('.handle', () => {
    beforeEach(async () => {
      authentificationRepository.recupererAccesPartenaire
        .withArgs('accessToken', Core.Structure.MILO)
        .resolves('token-beneficiaire-milo')
      authentificationRepository.seFairePasserPourUnConseiller
        .withArgs(beneficiaireMilo.conseiller!.id, 'accessToken')
        .resolves(success('token-conseiller-milo'))
      sessionMiloRepository.getForBeneficiaire
        .withArgs(
          'id-session',
          beneficiaireMilo.idPartenaire,
          'token-beneficiaire-milo',
          beneficiaireMilo.configuration.fuseauHoraire
        )
        .resolves(success(session))
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
      await commandHandler.handle(
        command,
        utilisateurBeneficiaire,
        beneficiaireMilo
      )

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
      await commandHandler.handle(
        command,
        utilisateurBeneficiaire,
        beneficiaireMilo
      )

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
          type: 'AUTO_INSCRIPTION',
          infoSession: {
            id: 'id-session',
            titre: 'Une session'
          }
        },
        { sentByBeneficiaire: true }
      )
    })

    it('notifie le bénéficiaire', async () => {
      // When
      await commandHandler.handle(
        command,
        utilisateurBeneficiaire,
        beneficiaireMilo
      )

      // Then
      expect(
        notificationService.notifierAutoinscriptionSession
      ).to.have.been.calledOnceWithExactly(session, beneficiaireMilo)
    })

    it('vérifie que le bénéficiaire existe', async () => {
      // When
      const result = await commandHandler.handle(
        command,
        utilisateurBeneficiaire,
        undefined
      )

      // Then
      expect(isFailure(result)).to.be.true()
      expect((result as Failure).error).to.be.an.instanceOf(NonTrouveError)
    })

    it('vérifie que le conseiller existe', async () => {
      // When
      const result = await commandHandler.handle(
        command,
        utilisateurBeneficiaire,
        { ...beneficiaireMilo, conseiller: undefined }
      )

      // Then
      expect(isFailure(result)).to.be.true()
      expect((result as Failure).error).to.be.an.instanceOf(NonTraitableError)
    })

    it('vérifie que le bénéficiaire peut s’inscrire', async () => {
      // Given
      sessionMiloRepository.getForBeneficiaire
        .withArgs(
          'id-session',
          beneficiaireMilo.idPartenaire,
          'token-beneficiaire-milo',
          beneficiaireMilo.configuration.fuseauHoraire
        )
        .resolves(success({ nbPlacesDisponibles: 0 }))

      // When
      const result = await commandHandler.handle(
        command,
        utilisateurBeneficiaire,
        beneficiaireMilo
      )

      // Then
      expect(isFailure(result)).to.be.true()
      expect((result as Failure).error).to.be.an.instanceOf(
        NombrePlacesInsuffisantError
      )
    })

    it('vérifie que la conversation existe', async () => {
      // Given
      chatRepository.recupererConversationIndividuelle
        .withArgs(beneficiaireMilo.id)
        .resolves(undefined)

      // When
      await commandHandler.handle(
        command,
        utilisateurBeneficiaire,
        beneficiaireMilo
      )

      // Then
      expect(chatRepository.envoyerMessageIndividuel).not.to.have.been.called()
    })
  })

  describe('.authorize', () => {
    it('échoue si le bénéficiaire n’existe pas', async () => {
      // When
      const result = await commandHandler.authorize(
        command,
        utilisateurBeneficiaire,
        undefined
      )

      // Then
      expect(isFailure(result)).to.equal(true)
      expect((result as Failure).error).to.be.an.instanceOf(NonTrouveError)
    })

    it('échoue si l’utilisateur n’est pas un bénéficiaire', async () => {
      // Given
      const utilisateurConseiller = unUtilisateurConseiller({
        id: beneficiaireMilo.id
      })

      // When
      const result = await commandHandler.authorize(
        command,
        utilisateurConseiller,
        beneficiaireMilo
      )

      // Then
      expect(isFailure(result)).to.equal(true)
      expect((result as Failure).error).to.be.an.instanceOf(DroitsInsuffisants)
    })

    it('échoue si l’utilisateur n’est pas le bénéficiaire', async () => {
      // Given
      const utilisateurBeneficiaire = unUtilisateurJeune({ id: 'un-autre-id' })

      // When
      const result = await commandHandler.authorize(
        command,
        utilisateurBeneficiaire,
        beneficiaireMilo
      )

      // Then
      expect(isFailure(result)).to.equal(true)
      expect((result as Failure).error).to.be.an.instanceOf(DroitsInsuffisants)
    })

    it('réussie si l’utilisateur est le bénéficiaire', async () => {
      // When
      const result = await commandHandler.authorize(
        command,
        utilisateurBeneficiaire,
        beneficiaireMilo
      )

      // Then
      expect(isSuccess(result)).to.equal(true)
    })
  })

  describe('.monitor', () => {
    it('envoie un événement d’incription', async () => {
      // When
      await commandHandler.monitor(utilisateurBeneficiaire)

      // Then
      expect(evenementService.creer).to.have.been.calledOnceWithExactly(
        'SESSION_AUTOINSCRIPTION',
        utilisateurBeneficiaire
      )
    })
  })
})
