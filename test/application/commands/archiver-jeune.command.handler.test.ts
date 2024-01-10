import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import {
  ArchiverJeuneCommand,
  ArchiverJeuneCommandHandler
} from '../../../src/application/commands/archiver-jeune.command.handler'
import { ArchiveJeune } from '../../../src/domain/archive-jeune'
import { Authentification } from '../../../src/domain/authentification'
import { Chat } from '../../../src/domain/chat'
import { Core } from '../../../src/domain/core'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { Mail } from '../../../src/domain/mail'
import { DateService } from '../../../src/utils/date-service'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { StubbedClass, expect, stubClass } from '../../utils'
import Structure = Core.Structure
import { emptySuccess } from '../../../src/building-blocks/types/result'

describe('ArchiverJeuneCommandHandler', () => {
  let archiverJeuneCommandHandler: ArchiverJeuneCommandHandler
  let jeuneRepository: StubbedType<Jeune.Repository>
  let archivageJeuneRepository: StubbedType<ArchiveJeune.Repository>
  let chatRepository: StubbedType<Chat.Repository>
  let authentificationRepository: StubbedType<Authentification.Repository>
  let evenementService: StubbedClass<EvenementService>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
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
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    dateService = stubClass(DateService)
    dateService.nowJs.returns(maintenant)
    mailService = stubInterface(sandbox)
    archiverJeuneCommandHandler = new ArchiverJeuneCommandHandler(
      jeuneRepository,
      archivageJeuneRepository,
      chatRepository,
      authentificationRepository,
      evenementService,
      conseillerAuthorizer,
      dateService,
      mailService
    )
  })

  describe('authorize', () => {
    it('autorise un conseiller pour son jeune', () => {
      // Given
      const command: ArchiverJeuneCommand = {
        idJeune: 'idJeune',
        motif: ArchiveJeune.MotifSuppression.CONTRAT_ARRIVE_A_ECHEANCE
      }
      // When
      archiverJeuneCommandHandler.authorize(command, unUtilisateurConseiller())

      // Then
      expect(
        conseillerAuthorizer.autoriserConseillerPourSonJeune
      ).to.have.been.calledWithExactly('idJeune', unUtilisateurConseiller())
    })
  })

  describe('handle', () => {
    describe('quand le jeune existe', () => {
      const command: ArchiverJeuneCommand = {
        idJeune: 'idJeune',
        motif: ArchiveJeune.MotifSuppression.CONTRAT_ARRIVE_A_ECHEANCE,
        commentaire: 'un commentaire'
      }
      const jeune = unJeune()

      beforeEach(async () => {
        // Given
        archivageJeuneRepository.archiver.resolves(emptySuccess())
        jeuneRepository.get.withArgs('idJeune').resolves(jeune)
      })

      it('archive le jeune', async () => {
        // When
        await archiverJeuneCommandHandler.handle(command)

        // Then
        const metadonneesArchive: ArchiveJeune.Metadonnees = {
          idJeune: command.idJeune,
          email: jeune.email,
          prenomJeune: jeune.firstName,
          nomJeune: jeune.lastName,
          structure: Structure.MILO,
          dateCreation: jeune.creationDate.toJSDate(),
          datePremiereConnexion: jeune.creationDate.plus({ day: 1 }).toJSDate(),
          motif: command.motif,
          commentaire: command.commentaire,
          dateArchivage: maintenant
        }
        expect(
          archivageJeuneRepository.archiver
        ).to.have.been.calledWithExactly(metadonneesArchive)
      })

      describe('supprime les données', () => {
        it('supprime son compte keycloak', async () => {
          // When
          await archiverJeuneCommandHandler.handle(command)

          // Then
          expect(
            authentificationRepository.deleteUtilisateurIdp
          ).to.have.been.calledWithExactly('idJeune')
        })

        it('supprime ses données en base', async () => {
          // When
          await archiverJeuneCommandHandler.handle(command)

          // Then
          expect(jeuneRepository.supprimer).to.have.been.calledWithExactly(
            'idJeune'
          )
        })

        it('supprime ses messages', async () => {
          // When
          await archiverJeuneCommandHandler.handle(command)

          // Then
          expect(chatRepository.supprimerChat).to.have.been.calledWithExactly(
            'idJeune'
          )
        })
      })
      describe('notifie le jeune', () => {
        it('envoie un email après la suppression des données', async () => {
          // When
          await archiverJeuneCommandHandler.handle(command)

          // Then
          expect(mailService.envoyerEmailJeuneArchive).to.have.been.calledWith(
            jeune,
            command.motif,
            command.commentaire
          )
        })
        it('n’envoie pas d’email quand la suppression des données a échoué', async () => {
          // Given
          // When
          await archiverJeuneCommandHandler.handle(command)

          // Then
          expect(mailService.envoyerEmailJeuneArchive).to.have.been.calledWith(
            jeune,
            command.motif,
            command.commentaire
          )
        })
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
