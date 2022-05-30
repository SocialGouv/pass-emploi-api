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
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { Conseiller } from '../../../src/domain/conseiller'
import { Mail } from '../../../src/domain/mail'
import { Jeune } from 'src/domain/jeune'

describe('UpdateRendezVousCommandHandler', () => {
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let notificationRepository: StubbedType<Notification.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let mailService: StubbedType<Mail.Service>
  let planificateurService: StubbedClass<PlanificateurService>
  let rendezVousAuthorizer = stubClass(RendezVousAuthorizer)
  let evenementService: StubbedClass<EvenementService>
  let updateRendezVousCommandHandler: UpdateRendezVousCommandHandler
  const jeune = unJeune()
  const rendezVous = unRendezVous({ jeunes: [jeune] })

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    notificationRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)
    mailService = stubInterface(sandbox)
    rendezVousAuthorizer = stubClass(RendezVousAuthorizer)
    planificateurService = stubClass(PlanificateurService)
    evenementService = stubClass(EvenementService)

    updateRendezVousCommandHandler = new UpdateRendezVousCommandHandler(
      rendezVousRepository,
      jeuneRepository,
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
          idsJeunes: ['x'],
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
        expect(rendezVousRepository.save).to.have.callCount(0)
        expect(notificationRepository.send).to.have.callCount(0)
        expect(result).to.deep.equal(
          failure(new NonTrouveError('RendezVous', command.idRendezVous))
        )
      })
    })
    describe('quand la presence conseiller est false pour un ENTRETIEN_INDIVIDUEL', () => {
      it('renvoie une failure', async () => {
        // Given
        const command: UpdateRendezVousCommand = {
          idsJeunes: ['x'],
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
        expect(rendezVousRepository.save).to.have.callCount(0)
        expect(notificationRepository.send).to.have.callCount(0)
        expect(result).to.deep.equal(
          failure(
            new MauvaiseCommandeError(
              'Le champ presenceConseiller ne peut etre modifé pour un rendez-vous Conseiller'
            )
          )
        )
      })
    })
    describe("quand un jeune de la liste n'est pas trouvé", () => {
      it('renvoie une failure', async () => {
        // Given
        const idJeuneNonTrouve = 'x'
        const command: UpdateRendezVousCommand = {
          idsJeunes: [idJeuneNonTrouve],
          idRendezVous: rendezVous.id,
          date: '2021-11-11T08:03:30.000Z',
          duree: 30,
          presenceConseiller: true
        }
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVous)
        jeuneRepository.get.withArgs(idJeuneNonTrouve).resolves(undefined)

        // When
        const result = await updateRendezVousCommandHandler.handle(command)
        // Then
        expect(rendezVousRepository.save).to.have.callCount(0)
        expect(notificationRepository.send).to.have.callCount(0)
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', idJeuneNonTrouve))
        )
      })
    })
    describe('quand tous les jeune de la liste sont trouvés', () => {
      const command: UpdateRendezVousCommand = {
        idsJeunes: [jeune.id],
        idRendezVous: rendezVous.id,
        date: rendezVous.date.toISOString(),
        duree: rendezVous.duree,
        commentaire: rendezVous.commentaire,
        presenceConseiller: rendezVous.presenceConseiller,
        modalite: rendezVous.modalite,
        adresse: rendezVous.adresse,
        organisme: rendezVous.organisme
      }
      beforeEach(() => {
        command.idsJeunes = [jeune.id]
        rendezVous.jeunes = [jeune]
      })

      describe('quand la liste des jeunes contient des jeunes supprimés, des jeunes inchangés et des jeunes ajoutés', () => {
        it("met à jour le rdv et l'association avec la bonne liste de jeunes", async () => {
          // Given
          const jeuneInchange = unJeune({ id: 'jeuneInchange' })
          const jeuneAjoute = unJeune({ id: 'jeuneAjoute' })
          const jeuneSupprime = unJeune({ id: 'jeuneSupprime' })
          rendezVous.jeunes = [jeuneInchange, jeuneSupprime]
          command.idsJeunes = [jeuneInchange.id, jeuneAjoute.id]
          rendezVousRepository.get
            .withArgs(command.idRendezVous)
            .resolves(rendezVous)
          jeuneRepository.get
            .withArgs(command.idsJeunes[0])
            .resolves(jeuneInchange)
          jeuneRepository.get
            .withArgs(command.idsJeunes[1])
            .resolves(jeuneAjoute)
          const rendezVousUpdated: RendezVous = {
            ...rendezVous,
            jeunes: [jeuneInchange, jeuneAjoute]
          }
          // When
          const result = await updateRendezVousCommandHandler.handle(command)
          // Then
          expect(result).to.deep.equal(success({ id: rendezVousUpdated.id }))
          expect(rendezVousRepository.save).to.have.been.calledWith(
            rendezVousUpdated
          )
          expect(notificationRepository.send).to.have.been.calledWith(
            Notification.createNouveauRdv(
              jeuneAjoute.pushNotificationToken,
              rendezVousUpdated.id
            )
          )
          expect(notificationRepository.send).to.have.been.calledWith(
            Notification.createRdvSupprime(
              jeuneSupprime.pushNotificationToken,
              rendezVous.date
            )
          )
          expect(notificationRepository.send).to.have.callCount(2)
          expect(
            planificateurService.supprimerRappelsRendezVous
          ).to.have.callCount(0)
          expect(
            planificateurService.planifierRappelsRendezVous
          ).to.have.callCount(0)
        })
      })
      describe("quand la date n'est pas modifiée", () => {
        it("ne replanifie pas les rappels et n'envoie pas la notif", async () => {
          // Given
          rendezVousRepository.get
            .withArgs(command.idRendezVous)
            .resolves(rendezVous)
          jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
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
          expect(notificationRepository.send).to.have.callCount(0)
          expect(
            planificateurService.supprimerRappelsRendezVous
          ).not.to.have.been.calledWith(rendezVousUpdated)
          expect(
            planificateurService.planifierRappelsRendezVous
          ).not.to.have.been.calledWith(rendezVousUpdated)
        })
      })
      describe('quand la date est modifiée', () => {
        it('envoie la notif de modification au jeune inchange, de creation au jeune ajoute, replanifie les rappels et met à jour le rendez-vous', async () => {
          // Given
          const date = '2022-04-04T09:54:04.561Z'
          const jeuneInchange = unJeune({ id: 'jeuneInchange' })
          const jeuneAjoute = unJeune({ id: 'jeuneAjoute' })
          rendezVous.jeunes = [jeuneInchange]
          command.date = date
          command.idsJeunes = [jeuneInchange.id, jeuneAjoute.id]
          rendezVousRepository.get
            .withArgs(command.idRendezVous)
            .resolves(rendezVous)
          jeuneRepository.get
            .withArgs(command.idsJeunes[0])
            .resolves(jeuneInchange)
          jeuneRepository.get
            .withArgs(command.idsJeunes[1])
            .resolves(jeuneAjoute)
          const rendezVousUpdated: RendezVous = {
            ...rendezVous,
            jeunes: [jeuneInchange, jeuneAjoute],
            date: new Date(date)
          }
          // When
          const result = await updateRendezVousCommandHandler.handle(command)
          // Then
          expect(result).to.deep.equal(success({ id: rendezVousUpdated.id }))
          expect(rendezVousRepository.save).to.have.been.calledWith(
            rendezVousUpdated
          )
          expect(notificationRepository.send).to.have.callCount(2)
          expect(notificationRepository.send).to.have.been.calledWith(
            Notification.createRendezVousMisAJour(
              jeuneInchange.pushNotificationToken,
              rendezVousUpdated.id
            )
          )
          expect(notificationRepository.send).to.have.been.calledWith(
            Notification.createNouveauRdv(
              jeuneAjoute.pushNotificationToken,
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
      describe("quand l'invitation est false", () => {
        it("n'envoie aucun mail", async () => {
          // Given
          rendezVous.invitation = false
          rendezVousRepository.get
            .withArgs(command.idRendezVous)
            .resolves(rendezVous)
          jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
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
      describe("quand l'invitation est true", () => {
        describe("quand c'est le conseiller qui a créé le rendez-vous qui le modifie", () => {
          it('envoie le mail à ce conseiller ', async () => {
            // Given
            rendezVous.invitation = true

            const date = '2022-04-04T09:54:04.561Z'
            command.date = date
            rendezVousRepository.get
              .withArgs(command.idRendezVous)
              .resolves(rendezVous)
            jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
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
              RendezVous.Operation.MODIFICATION
            )
          })
        })
        describe("quand le conseiller qui modifie le rendez-vous n'est pas celui qui l'a créé", () => {
          it('envoie le mail au conseiller créateur', async () => {
            // Given
            rendezVous.invitation = true
            const date = '2022-04-04T09:54:04.561Z'
            command.date = date
            rendezVousRepository.get
              .withArgs(command.idRendezVous)
              .resolves(rendezVous)
            jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
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
              RendezVous.Operation.MODIFICATION
            )
          })
        })
      })
    })
  })

  describe('authorize', () => {
    it('authorise un conseiller', async () => {
      // Given
      const command: UpdateRendezVousCommand = {
        idsJeunes: ['x'],
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
