import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import { SupportAuthorizer } from '../../../../src/application/authorizers/support-authorizer'
import {
  ArchiverJeuneSupportCommand,
  ArchiverJeuneSupportCommandHandler
} from '../../../../src/application/commands/support/archiver-jeune-support.command.handler'
import { emptySuccess } from '../../../../src/building-blocks/types/result'
import { ArchiveJeune } from '../../../../src/domain/archive-jeune'
import { Authentification } from '../../../../src/domain/authentification'
import { Chat } from '../../../../src/domain/chat'
import { Core } from '../../../../src/domain/core'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { Mail } from '../../../../src/domain/mail'
import { DateService } from '../../../../src/utils/date-service'
import { unUtilisateurSupport } from '../../../fixtures/authentification.fixture'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { expect, StubbedClass, stubClass } from '../../../utils'
import Structure = Core.Structure

describe('ArchiverJeuneSupportCommandHandler', () => {
  let archiverJeuneSupportCommandHandler: ArchiverJeuneSupportCommandHandler
  let jeuneRepository: StubbedType<Jeune.Repository>
  let archivageJeuneRepository: StubbedType<ArchiveJeune.Repository>
  let chatRepository: StubbedType<Chat.Repository>
  let authentificationRepository: StubbedType<Authentification.Repository>
  let authorizeSupport: StubbedClass<SupportAuthorizer>
  let dateService: StubbedClass<DateService>
  let mailService: StubbedType<Mail.Service>

  const maintenant = new Date('2022-03-01T03:24:00Z')

  beforeEach(() => {
    const sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    archivageJeuneRepository = stubInterface(sandbox)
    chatRepository = stubInterface(sandbox)
    authentificationRepository = stubInterface(sandbox)
    authorizeSupport = stubClass(SupportAuthorizer)
    dateService = stubClass(DateService)
    dateService.nowJs.returns(maintenant)
    mailService = stubInterface(sandbox)
    archiverJeuneSupportCommandHandler = new ArchiverJeuneSupportCommandHandler(
      jeuneRepository,
      archivageJeuneRepository,
      chatRepository,
      authentificationRepository,
      authorizeSupport,
      dateService,
      mailService
    )
  })

  describe('authorize', () => {
    it('autorise un conseiller pour son jeune', () => {
      // Given
      const command: ArchiverJeuneSupportCommand = {
        idJeune: 'idJeune'
      }
      // When
      archiverJeuneSupportCommandHandler.authorize(
        command,
        unUtilisateurSupport()
      )

      // Then
      expect(authorizeSupport.autoriserSupport).to.have.been.calledWithExactly(
        unUtilisateurSupport()
      )
    })
  })

  describe('handle', () => {
    describe('quand le jeune existe', () => {
      const command: ArchiverJeuneSupportCommand = {
        idJeune: 'idJeune'
      }
      const jeune = unJeune({ id: command.idJeune })

      it('archive le jeune', async () => {
        // Given
        jeuneRepository.get.withArgs(command.idJeune).resolves(jeune)

        // When
        const result = await archiverJeuneSupportCommandHandler.handle(command)

        // Then
        const metadonneesArchive: ArchiveJeune.Metadonnees = {
          idJeune: command.idJeune,
          email: jeune.email,
          prenomJeune: jeune.firstName,
          nomJeune: jeune.lastName,
          structure: Structure.MILO,
          dispositif: Jeune.Dispositif.CEJ,
          dateCreation: jeune.creationDate.toJSDate(),
          datePremiereConnexion: jeune.creationDate.plus({ day: 1 }).toJSDate(),
          motif: 'Support',
          commentaire:
            "Pour des raisons techniques nous avons procédé à l'archivage de votre compte.",
          dateArchivage: maintenant
        }

        expect(result).to.deep.equal(emptySuccess())
        expect(
          archivageJeuneRepository.archiver
        ).to.have.been.calledWithExactly(metadonneesArchive)
        expect(
          authentificationRepository.deleteUtilisateurIdp
        ).to.have.been.calledWithExactly('idJeune')
        expect(jeuneRepository.supprimer).to.have.been.calledWithExactly(
          'idJeune'
        )
        expect(chatRepository.supprimerChat).to.have.been.calledWithExactly(
          'idJeune'
        )
        expect(mailService.envoyerEmailJeuneArchive).to.have.been.calledWith(
          jeune,
          metadonneesArchive.motif,
          metadonneesArchive.commentaire
        )
      })
    })
  })
})
