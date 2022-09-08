import {
  ArchiverJeuneCommand,
  ArchiverJeuneCommandHandler
} from '../../../src/application/commands/archiver-jeune.command.handler'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { ArchiveJeune } from '../../../src/domain/archive-jeune'
import { Chat } from '../../../src/domain/chat'
import { Authentification } from '../../../src/domain/authentification'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import { ConseillerForJeuneAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-for-jeune'
import { DateService } from '../../../src/utils/date-service'
import { createSandbox } from 'sinon'
import { expect, StubbedClass, stubClass } from '../../utils'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { Mail } from '../../../src/domain/mail'

describe('ArchiverJeuneCommandHandler', () => {
  let archiverJeuneCommandHandler: ArchiverJeuneCommandHandler
  let jeuneRepository: StubbedType<Jeune.Repository>
  let archivageJeuneRepository: StubbedType<ArchiveJeune.Repository>
  let chatRepository: StubbedType<Chat.Repository>
  let authentificationRepository: StubbedType<Authentification.Repository>
  let evenementService: StubbedClass<EvenementService>
  let authorizeConseillerForJeune: StubbedClass<ConseillerForJeuneAuthorizer>
  let dateService: StubbedClass<DateService>
  let mailService: StubbedType<Mail.Service>

  const maintenant = new Date('2022-03-01T03:24:00Z')

  beforeEach(() => {
    const sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    archivageJeuneRepository = stubInterface(sandbox)
    chatRepository = stubInterface(sandbox)
    authentificationRepository = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)
    authorizeConseillerForJeune = stubClass(ConseillerForJeuneAuthorizer)
    dateService = stubClass(DateService)
    dateService.nowJs.returns(maintenant)
    mailService = stubInterface(sandbox)
    archiverJeuneCommandHandler = new ArchiverJeuneCommandHandler(
      jeuneRepository,
      archivageJeuneRepository,
      chatRepository,
      authentificationRepository,
      evenementService,
      authorizeConseillerForJeune,
      dateService,
      mailService
    )
  })

  describe('authorize', () => {
    it('autorise un conseiller pour son jeune', () => {
      // Given
      const command: ArchiverJeuneCommand = {
        idJeune: 'idJeune',
        motif: ArchiveJeune.MotifSuppression.RADIATION_DU_CEJ
      }
      // When
      archiverJeuneCommandHandler.authorize(command, unUtilisateurConseiller())

      // Then
      expect(
        authorizeConseillerForJeune.authorize
      ).to.have.been.calledWithExactly('idJeune', unUtilisateurConseiller())
    })
  })

  describe('handle', () => {
    describe('quand le jeune existe', () => {
      const command: ArchiverJeuneCommand = {
        idJeune: 'idJeune',
        motif: ArchiveJeune.MotifSuppression.RADIATION_DU_CEJ,
        commentaire: 'un commentaire'
      }
      const jeune = unJeune()

      beforeEach(async () => {
        // Given
        jeuneRepository.get.withArgs('idJeune').resolves(jeune)

        // When
        await archiverJeuneCommandHandler.handle(command)
      })

      it('archive le jeune', () => {
        // Then
        const metadonneesArchive: ArchiveJeune.Metadonnees = {
          idJeune: command.idJeune,
          email: jeune.email,
          prenomJeune: jeune.firstName,
          nomJeune: jeune.lastName,
          motif: command.motif,
          commentaire: command.commentaire,
          dateArchivage: maintenant
        }
        expect(
          archivageJeuneRepository.archiver
        ).to.have.been.calledWithExactly(metadonneesArchive)
      })

      it('supprime sont compte keycloak', () => {
        expect(
          authentificationRepository.deleteJeuneIdp
        ).to.have.been.calledWithExactly('idJeune')
      })

      it('supprime ses données en base', () => {
        expect(jeuneRepository.supprimer).to.have.been.calledWithExactly(
          'idJeune'
        )
      })

      it('supprime messages', () => {
        expect(chatRepository.supprimerChat).to.have.been.calledWithExactly(
          'idJeune'
        )
      })

      it('envoie un email au jeune', () => {
        expect(mailService.envoyerEmailJeuneArchive).to.have.been.calledWith(
          jeune,
          command.motif,
          command.commentaire
        )
      })
    })
  })

  describe('monitor', () => {
    it('autorise un conseiller pour son jeune', () => {
      // When
      archiverJeuneCommandHandler.monitor(unUtilisateurConseiller())

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.COMPTE_ARCHIVE,
        unUtilisateurConseiller()
      )
    })
  })
})
