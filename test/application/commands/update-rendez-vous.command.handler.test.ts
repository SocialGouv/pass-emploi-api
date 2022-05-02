import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { RendezVousAuthorizer } from 'src/application/authorizers/authorize-rendezvous'
import {
  UpdateRendezVousCommand,
  UpdateRendezVousCommandHandler
} from 'src/application/commands/update-rendez-vous.command.handler'
import { EvenementService } from 'src/domain/evenement'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Notification } from '../../../src/domain/notification'
import { PlanificateurService } from '../../../src/domain/planificateur'
import { RendezVous } from '../../../src/domain/rendez-vous'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import {
  createSandbox,
  DatabaseForTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { Conseiller } from '../../../src/domain/conseiller'
import { Mail } from '../../../src/domain/mail'

describe('UpdateRendezVousCommandHandler', () => {
  DatabaseForTesting.prepare()
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let notificationRepository: StubbedType<Notification.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let mailService: StubbedType<Mail.Service>
  let planificateurService: StubbedClass<PlanificateurService>
  let rendezVousAuthorizer = stubClass(RendezVousAuthorizer)
  let evenementService: StubbedClass<EvenementService>
  let updateRendezVousCommandHandler: UpdateRendezVousCommandHandler
  const jeune = unJeune()
  let rendezVous: RendezVous

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    notificationRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)
    mailService = stubInterface(sandbox)
    rendezVousAuthorizer = stubClass(RendezVousAuthorizer)
    planificateurService = stubClass(PlanificateurService)
    evenementService = stubClass(EvenementService)
    rendezVous = unRendezVous({}, jeune)

    updateRendezVousCommandHandler = new UpdateRendezVousCommandHandler(
      rendezVousRepository,
      notificationRepository,
      mailService,
      conseillerRepository,
      rendezVousAuthorizer,
      planificateurService,
      evenementService
    )
  })

  describe('handle', () => {
    describe("quand le rendez-vous n'existe pas", () => {
      it('renvoie une failure', async () => {
        // Given
        const command: UpdateRendezVousCommand = {
          idRendezVous: rendezVous.id,
          date: '2021-11-11T08:03:30.000Z',
          duree: 30,
          presenceConseiller: true
        }
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(undefined)
        // When
        const result = await updateRendezVousCommandHandler.handle(command)
        // Then
        expect(rendezVousRepository.save).not.to.have.been.calledWith(
          rendezVous
        )
        expect(notificationRepository.send).not.to.have.been.calledWith(
          Notification.createRendezVousMisAJour(
            jeune.pushNotificationToken,
            rendezVous.id
          )
        )
        expect(result).to.deep.equal(
          failure(new NonTrouveError('RendezVous', command.idRendezVous))
        )
      })
    })
    describe('quand la presence conseiller est false pour un ENTRETIEN_INDIVIDUEL', () => {
      it('renvoie une failure', async () => {
        // Given
        const command: UpdateRendezVousCommand = {
          idRendezVous: rendezVous.id,
          date: '2021-11-11T08:03:30.000Z',
          duree: 30,
          presenceConseiller: false
        }
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVous)
        // When
        const result = await updateRendezVousCommandHandler.handle(command)
        // Then
        expect(rendezVousRepository.save).not.to.have.been.calledWith(
          rendezVous
        )
        expect(notificationRepository.send).not.to.have.been.calledWith(
          Notification.createRendezVousMisAJour(
            jeune.pushNotificationToken,
            rendezVous.id
          )
        )
        expect(result).to.deep.equal(
          failure(
            new MauvaiseCommandeError(
              'Le champ presenceConseiller ne peut etre modifé pour un rendez-vous Conseiller'
            )
          )
        )
      })
    })
    describe('quand la date est modifiée', () => {
      it('envoie la notif, replanifie les rappels et met à jour le rendez-vous', async () => {
        // Given
        const date = '2022-04-04T09:54:04.561Z'
        const command: UpdateRendezVousCommand = {
          idRendezVous: rendezVous.id,
          date,
          commentaire: rendezVous.commentaire,
          duree: rendezVous.duree,
          presenceConseiller: rendezVous.presenceConseiller,
          modalite: rendezVous.modalite,
          adresse: rendezVous.adresse,
          organisme: rendezVous.organisme
        }
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVous)
        const rendezVousUpdated: RendezVous = {
          ...rendezVous,
          date: new Date(date)
        }
        // When
        const result = await updateRendezVousCommandHandler.handle(command)
        // Then
        expect(result).to.deep.equal(success({ id: rendezVousUpdated.id }))
        expect(rendezVousRepository.save).to.have.been.calledWith(
          rendezVousUpdated
        )
        expect(notificationRepository.send).to.have.been.calledWith(
          Notification.createRendezVousMisAJour(
            jeune.pushNotificationToken,
            rendezVousUpdated.id
          )
        )
        expect(
          planificateurService.supprimerRappelsRendezVous
        ).to.have.been.calledWith(rendezVousUpdated)
        expect(
          planificateurService.planifierRappelsRendezVous
        ).to.have.been.calledWith(rendezVousUpdated)
      })
    })
    describe("quand la date n'est pas modifiée", () => {
      it('ne replanifie pas les rappels', async () => {
        // Given
        const command: UpdateRendezVousCommand = {
          idRendezVous: rendezVous.id,
          date: '2021-11-11T08:03:30.000Z',
          duree: rendezVous.duree,
          commentaire: rendezVous.commentaire,
          presenceConseiller: rendezVous.presenceConseiller,
          modalite: rendezVous.modalite,
          adresse: rendezVous.adresse,
          organisme: rendezVous.organisme
        }
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVous)
        const rendezVousUpdated: RendezVous = {
          ...rendezVous,
          date: rendezVous.date
        }
        // When
        const result = await updateRendezVousCommandHandler.handle(command)
        // Then
        expect(result).to.deep.equal(success({ id: rendezVousUpdated.id }))
        expect(rendezVousRepository.save).to.have.been.calledWith(
          rendezVousUpdated
        )
        expect(notificationRepository.send).to.have.been.calledWith(
          Notification.createRendezVousMisAJour(
            jeune.pushNotificationToken,
            rendezVousUpdated.id
          )
        )
        expect(
          planificateurService.supprimerRappelsRendezVous
        ).not.to.have.been.calledWith(rendezVousUpdated)
        expect(
          planificateurService.planifierRappelsRendezVous
        ).not.to.have.been.calledWith(rendezVousUpdated)
      })
    })
    describe('quand l"invitation est false', () => {
      it('n"envoie aucun mail', async () => {
        // Given
        rendezVous.invitation = false
        const command: UpdateRendezVousCommand = {
          idRendezVous: rendezVous.id,
          date: '2021-11-11T08:03:30.000Z',
          duree: 30,
          presenceConseiller: true
        }
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVous)
        // When
        await updateRendezVousCommandHandler.handle(command)
        // Then
        expect(mailService.envoyerMailRendezVous).not.to.have.been.calledWith(
          jeune.conseiller,
          rendezVous,
          true
        )
      })
    })
    describe('quand l"invitation est true', () => {
      describe('quand c"est le conseiller qui a créé le rendez-vous qui le modifie', () => {
        it('envoie le mail à ce conseiller ', async () => {
          // Given
          rendezVous.invitation = true

          const date = '2022-04-04T09:54:04.561Z'
          const command: UpdateRendezVousCommand = {
            idRendezVous: rendezVous.id,
            date,
            commentaire: rendezVous.commentaire,
            duree: rendezVous.duree,
            presenceConseiller: rendezVous.presenceConseiller,
            modalite: rendezVous.modalite,
            adresse: rendezVous.adresse,
            organisme: rendezVous.organisme
          }
          rendezVousRepository.get
            .withArgs(command.idRendezVous)
            .resolves(rendezVous)
          const rendezVousUpdated: RendezVous = {
            ...rendezVous,
            date: new Date(date)
          }

          conseillerRepository.get
            .withArgs(rendezVousUpdated.jeunes[0].conseiller?.id)
            .resolves(rendezVousUpdated.jeunes[0].conseiller)

          // When
          await updateRendezVousCommandHandler.handle(command)
          // Then
          expect(
            mailService.envoyerMailRendezVous
          ).to.have.been.calledWithExactly(
            rendezVousUpdated.jeunes[0].conseiller,
            rendezVousUpdated,
            true
          )
        })
      })
      describe('quand le conseiller qui modifie le rendez-vous n"est pas celui qui l"a créé', () => {
        it('envoie le mail au conseiller créateur', async () => {
          // Given
          rendezVous.invitation = true
          const date = '2022-04-04T09:54:04.561Z'
          const command: UpdateRendezVousCommand = {
            idRendezVous: rendezVous.id,
            date,
            commentaire: rendezVous.commentaire,
            duree: rendezVous.duree,
            presenceConseiller: rendezVous.presenceConseiller,
            modalite: rendezVous.modalite,
            adresse: rendezVous.adresse,
            organisme: rendezVous.organisme
          }
          rendezVousRepository.get
            .withArgs(command.idRendezVous)
            .resolves(rendezVous)
          const rendezVousUpdated: RendezVous = {
            ...rendezVous,
            date: new Date(date)
          }

          conseillerRepository.get
            .withArgs(rendezVousUpdated.createur.id)
            .resolves(rendezVousUpdated.jeunes[0].conseiller)

          // When
          await updateRendezVousCommandHandler.handle(command)
          // Then
          expect(
            mailService.envoyerMailRendezVous
          ).to.have.been.calledWithExactly(
            rendezVousUpdated.jeunes[0].conseiller,
            rendezVousUpdated,
            true
          )
        })
      })
    })
  })

  describe('authorize', () => {
    it('authorise un conseiller', async () => {
      // Given
      const command: UpdateRendezVousCommand = {
        idRendezVous: rendezVous.id,
        date: '2021-11-11T08:03:30.000Z',
        duree: 30,
        presenceConseiller: true
      }

      const utilisateur = unUtilisateurConseiller()

      // When
      await updateRendezVousCommandHandler.authorize(command, utilisateur)

      // Then
      expect(rendezVousAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idRendezVous,
        utilisateur
      )
    })
  })
})
