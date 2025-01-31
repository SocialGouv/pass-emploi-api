import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { createSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import {
  ArchiverJeuneCommand,
  ArchiverJeuneCommandHandler
} from '../../../src/application/commands/archiver-jeune.command.handler'
import { MauvaiseCommandeError } from '../../../src/building-blocks/types/domain-error'
import { ArchiveJeune } from '../../../src/domain/archive-jeune'
import { Authentification } from '../../../src/domain/authentification'
import { Chat } from '../../../src/domain/chat'
import { Core } from '../../../src/domain/core'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { Mail } from '../../../src/domain/mail'
import { DateService } from '../../../src/utils/date-service'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { StubbedClass, expect, stubClass } from '../../utils'
import Structure = Core.Structure
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'

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
    dateService.now.returns(DateTime.fromJSDate(maintenant))
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
    const jeune = unJeune()

    beforeEach(async () => {
      // Given
      archivageJeuneRepository.archiver.resolves(emptySuccess())
      jeuneRepository.get.withArgs('idJeune').resolves(jeune)
    })

    describe('quand l’archivage est correct', () => {
      const command: ArchiverJeuneCommand = {
        idJeune: 'idJeune',
        motif: ArchiveJeune.MotifSuppression.CONTRAT_ARRIVE_A_ECHEANCE,
        dateFinAccompagnement: uneDatetime(),
        commentaire: 'un commentaire'
      }

      beforeEach(async () => {
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
          structure: Structure.MILO,
          dispositif: Jeune.Dispositif.CEJ,
          idPartenaire: jeune.idPartenaire,
          dateCreation: jeune.creationDate.toJSDate(),
          datePremiereConnexion: jeune.creationDate.plus({ day: 1 }).toJSDate(),
          dateFinAccompagnement: new Date('2020-04-06T12:00:00.000Z'),
          motif: command.motif,
          commentaire: command.commentaire,
          dateArchivage: maintenant
        }
        expect(
          archivageJeuneRepository.archiver
        ).to.have.been.calledWithExactly(metadonneesArchive)
      })

      it('supprime son compte keycloak', () => {
        expect(
          authentificationRepository.deleteUtilisateurIdp
        ).to.have.been.calledWithExactly('idJeune')
      })

      it('supprime ses données en base', () => {
        expect(jeuneRepository.supprimer).to.have.been.calledWithExactly(
          'idJeune'
        )
      })

      it('supprime ses messages', () => {
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

    describe('contrôle la date de fin d’accompagnement', () => {
      it('doit être après la création du bénéficiaire', async () => {
        // When
        const result = await archiverJeuneCommandHandler.handle({
          idJeune: 'idJeune',
          motif: ArchiveJeune.MotifSuppression.CONTRAT_ARRIVE_A_ECHEANCE,
          dateFinAccompagnement: jeune.creationDate.minus({ day: 1 }),
          commentaire: 'un commentaire'
        })

        // Then
        expect(result).to.deep.equal(
          failure(
            new MauvaiseCommandeError(
              'Le date de fin d’accompagnement doit être postérieure à la date de création du bénéficiaire'
            )
          )
        )
      })

      it('ne doit pas être dans le futur', async () => {
        // When
        const result = await archiverJeuneCommandHandler.handle({
          idJeune: 'idJeune',
          motif: ArchiveJeune.MotifSuppression.CONTRAT_ARRIVE_A_ECHEANCE,
          dateFinAccompagnement: DateTime.fromJSDate(maintenant).plus({
            day: 1
          }),
          commentaire: 'un commentaire'
        })

        // Then
        expect(result).to.deep.equal(
          failure(
            new MauvaiseCommandeError(
              'Le date de fin d’accompagnement ne peut pas être dans le futur'
            )
          )
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
