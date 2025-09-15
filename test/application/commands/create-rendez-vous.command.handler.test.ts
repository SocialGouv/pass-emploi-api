import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import { PlanificateurService } from '../../../src/domain/planificateur'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { failure, success } from '../../../src/building-blocks/types/result'
import {
  CodeTypeRendezVous,
  RendezVous
} from '../../../src/domain/rendez-vous/rendez-vous'
import { Notification } from '../../../src/domain/notification/notification'
import { uneConfiguration, unJeune } from '../../fixtures/jeune.fixture'
import {
  ConseillerSansAgenceError,
  DateNonAutoriseeError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { Jeune } from '../../../src/domain/jeune/jeune'
import {
  CreateRendezVousCommand,
  CreateRendezVousCommandHandler
} from '../../../src/application/commands/create-rendez-vous.command.handler'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { Mail } from '../../../src/domain/mail'
import { Conseiller } from 'src/domain/conseiller'
import { stubClassSandbox } from 'test/utils/types'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'

describe('CreateRendezVousCommandHandler', () => {
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let notificationService: StubbedClass<Notification.Service>
  let rendezVousFactory: StubbedClass<RendezVous.Factory>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let planificateurService: StubbedClass<PlanificateurService>
  const conseillerAuthorizer = stubClass(ConseillerAuthorizer)
  let createRendezVousCommandHandler: CreateRendezVousCommandHandler
  let evenementService: StubbedClass<EvenementService>
  let mailClient: StubbedType<Mail.Service>
  const conseiller = unConseiller()
  const jeune1 = unJeune({
    id: 'jeune-1',
    configuration: uneConfiguration({ idJeune: 'jeune-1' }),
    conseiller
  })
  const jeune2 = unJeune({
    id: 'jeune-2',
    configuration: uneConfiguration({ idJeune: 'jeune-2' }),
    conseiller
  })

  const rendezVous = unRendezVous({ jeunes: [jeune1] })

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)
    notificationService = stubClassSandbox(Notification.Service, sandbox)
    notificationService.notifierLesJeunesDuRdv.resolves()
    jeuneRepository = stubInterface(sandbox)
    planificateurService = stubClass(PlanificateurService)
    rendezVousFactory = stubClass(RendezVous.Factory)
    evenementService = stubClass(EvenementService)
    mailClient = stubInterface(sandbox)

    createRendezVousCommandHandler = new CreateRendezVousCommandHandler(
      rendezVousRepository,
      jeuneRepository,
      conseillerRepository,
      rendezVousFactory,
      notificationService,
      mailClient,
      conseillerAuthorizer,
      planificateurService,
      evenementService
    )
  })

  describe('handle', () => {
    describe("quand le conseiller n'existe pas", () => {
      it('renvoie une failure', async () => {
        // Given
        const command: CreateRendezVousCommand = {
          idsJeunes: [jeune1.id, jeune2.id],
          idConseiller: conseiller.id,
          commentaire: rendezVous.commentaire,
          date: rendezVous.date.toDateString(),
          duree: rendezVous.duree,
          modalite: 'tel'
        }
        conseillerRepository.get
          .withArgs(command.idConseiller)
          .resolves(undefined)

        // When
        const result = await createRendezVousCommandHandler.handle(command)

        // Then
        expect(rendezVousRepository.save).not.to.have.been.calledWith(
          rendezVous.id
        )
        expect(notificationService.notifierLesJeunesDuRdv).to.have.callCount(0)
        expect(mailClient.envoyerMailRendezVous).callCount(0)
        expect(result).to.deep.equal(failure(new NonTrouveError('Conseiller')))
      })
    })
    describe("quand au moins un des jeunes n'existe pas", () => {
      it('renvoie une failure', async () => {
        // Given
        const command: CreateRendezVousCommand = {
          idsJeunes: [jeune1.id, jeune2.id],
          idConseiller: conseiller.id,
          commentaire: rendezVous.commentaire,
          date: rendezVous.date.toDateString(),
          duree: rendezVous.duree,
          modalite: 'tel'
        }
        conseillerRepository.get
          .withArgs(command.idConseiller)
          .resolves(conseiller)
        jeuneRepository.findAll.withArgs(command.idsJeunes).resolves([jeune1])

        // When
        const result = await createRendezVousCommandHandler.handle(command)

        // Then
        expect(rendezVousRepository.save).not.to.have.been.calledWith(
          rendezVous.id
        )
        expect(notificationService.notifierLesJeunesDuRdv).to.have.callCount(0)
        expect(mailClient.envoyerMailRendezVous).callCount(0)
        expect(result).to.deep.equal(failure(new NonTrouveError('Jeune')))
      })
    })
    describe("quand la création n'est pas possible", () => {
      it('renvoie une failure', async () => {
        // Given
        const command: CreateRendezVousCommand = {
          idsJeunes: [jeune1.id, jeune2.id],
          idConseiller: conseiller.id,
          commentaire: rendezVous.commentaire,
          date: rendezVous.date.toDateString(),
          duree: rendezVous.duree,
          modalite: 'tel'
        }
        conseillerRepository.get
          .withArgs(command.idConseiller)
          .resolves(conseiller)
        jeuneRepository.findAll
          .withArgs(command.idsJeunes)
          .resolves([jeune1, jeune2])

        rendezVousFactory.creer
          .withArgs(command, [jeune1, jeune2], conseiller)
          .returns(failure(new ConseillerSansAgenceError(conseiller.id)))

        // When
        const result = await createRendezVousCommandHandler.handle(command)

        // Then
        expect(rendezVousRepository.save).not.to.have.been.calledWith(
          rendezVous.id
        )
        expect(notificationService.notifierLesJeunesDuRdv).to.have.callCount(0)
        expect(mailClient.envoyerMailRendezVous).callCount(0)
        expect(result).to.deep.equal(
          failure(new ConseillerSansAgenceError(conseiller.id))
        )
      })
    })

    describe("quand la date du rendez-vous n'est pas valide", () => {
      it('renvoie une failure', async () => {
        // Given
        const command: CreateRendezVousCommand = {
          idsJeunes: [jeune1.id, jeune2.id],
          idConseiller: conseiller.id,
          commentaire: rendezVous.commentaire,
          date: new Date('2020-09-20 10:27:21').toDateString(),
          duree: rendezVous.duree
        }
        conseillerRepository.get
          .withArgs(command.idConseiller)
          .resolves(conseiller)
        jeuneRepository.findAll
          .withArgs(command.idsJeunes)
          .resolves([jeune1, jeune2])

        rendezVousFactory.creer
          .withArgs(command, [jeune1, jeune2], conseiller)
          .returns(failure(new DateNonAutoriseeError()))

        // When
        const result = await createRendezVousCommandHandler.handle(command)

        // Then
        expect(rendezVousRepository.save).not.to.have.been.calledWith(
          rendezVous.id
        )
        expect(notificationService.notifierLesJeunesDuRdv).to.have.callCount(0)
        expect(mailClient.envoyerMailRendezVous).callCount(0)
        expect(result).to.deep.equal(failure(new DateNonAutoriseeError()))
      })
    })
    describe('quand la création est possible', () => {
      beforeEach(() => {
        jeuneRepository.findAll.withArgs([jeune1.id]).resolves([jeune1])
        jeuneRepository.findAll
          .withArgs([jeune1.id, jeune2.id])
          .resolves([jeune1, jeune2])

        conseillerRepository.get.withArgs(conseiller.id).resolves(conseiller)
      })

      describe("quand le jeune s'est connecté au moins une fois sur l'application", () => {
        it('crée un rendez-vous, envoie une notification au jeune, envoie un mail au conseiller et planifie', async () => {
          // Given
          const rendezVousAvecInvitation = { ...rendezVous, invitation: true }
          const command: CreateRendezVousCommand = {
            idsJeunes: [jeune1.id, jeune2.id],
            idConseiller: conseiller.id,
            commentaire: rendezVousAvecInvitation.commentaire,
            date: rendezVousAvecInvitation.date.toDateString(),
            duree: rendezVousAvecInvitation.duree,
            invitation: true
          }

          rendezVousFactory.creer
            .withArgs(command, [jeune1, jeune2], conseiller)
            .returns(success(rendezVousAvecInvitation))

          // When
          const result = await createRendezVousCommandHandler.handle(command)

          // Then
          expect(result).to.deep.equal(success(rendezVousAvecInvitation.id))
          expect(rendezVousRepository.save).to.have.been.calledWith(
            rendezVousAvecInvitation
          )
          expect(
            notificationService.notifierLesJeunesDuRdv
          ).to.have.been.calledOnceWithExactly(
            rendezVousAvecInvitation,
            Notification.Type.NEW_RENDEZVOUS
          )
          expect(mailClient.envoyerMailRendezVous).to.have.been.calledWith(
            jeune1.conseiller,
            rendezVousAvecInvitation
          )
          expect(
            planificateurService.planifierRappelsRendezVous
          ).to.have.been.calledWith(rendezVousAvecInvitation)
        })
      })
      describe("quand un jeune ne s'est jamais connecté sur l'application", () => {
        it('crée un rendez-vous et envoie un mail au conseiller sans envoyer de notifications au jeune', async () => {
          // Given
          const rendezVousAvecInvitation = { ...rendezVous, invitation: true }

          const jeuneSansPushToken = unJeune({
            configuration: {
              idJeune: unJeune().id,
              pushNotificationToken: undefined
            }
          })
          const command: CreateRendezVousCommand = {
            idsJeunes: [jeuneSansPushToken.id],
            idConseiller: conseiller.id,
            commentaire: rendezVousAvecInvitation.commentaire,
            date: rendezVousAvecInvitation.date.toDateString(),
            duree: rendezVousAvecInvitation.duree,
            invitation: true
          }
          jeuneRepository.findAll
            .withArgs([jeuneSansPushToken.id])
            .resolves([jeuneSansPushToken])

          conseillerRepository.get
            .withArgs(command.idConseiller)
            .resolves(conseiller)

          rendezVousFactory.creer
            .withArgs(command, [jeuneSansPushToken], conseiller)
            .returns(success(rendezVousAvecInvitation))

          // When
          const result = await createRendezVousCommandHandler.handle(command)
          // Then
          expect(result).to.deep.equal(success(rendezVousAvecInvitation.id))
          expect(rendezVousRepository.save).to.have.been.calledWith(
            rendezVousAvecInvitation
          )
          expect(
            notificationService.notifierLesJeunesDuRdv
          ).to.have.been.calledOnceWithExactly(
            rendezVousAvecInvitation,
            Notification.Type.NEW_RENDEZVOUS
          )
          expect(mailClient.envoyerMailRendezVous).to.have.been.calledWith(
            unConseiller(),
            rendezVousAvecInvitation
          )
        })
      })
      describe("quand le conseiller n'a pas d'email", () => {
        it('crée un rendez-vous sans envoyer un mail au conseiller', async () => {
          // Given
          const conseillerSansEmail: Conseiller = {
            ...unConseiller(),
            email: undefined
          }
          const command: CreateRendezVousCommand = {
            idsJeunes: [jeune1.id],
            idConseiller: conseillerSansEmail.id,
            commentaire: rendezVous.commentaire,
            date: rendezVous.date.toDateString(),
            duree: rendezVous.duree,
            invitation: true
          }

          conseillerRepository.get
            .withArgs(command.idConseiller)
            .resolves(conseillerSansEmail)

          jeuneRepository.findAll.withArgs([jeune1.id]).resolves([jeune1])

          rendezVousFactory.creer
            .withArgs(command, [jeune1], conseillerSansEmail)
            .returns(success(rendezVous))

          // When
          const result = await createRendezVousCommandHandler.handle(command)

          // Then
          expect(result).to.deep.equal(success(rendezVous.id))
          expect(rendezVousRepository.save).to.have.been.calledWith(rendezVous)
          expect(
            notificationService.notifierLesJeunesDuRdv
          ).to.have.been.calledOnceWithExactly(
            rendezVous,
            Notification.Type.NEW_RENDEZVOUS
          )
          expect(mailClient.envoyerMailRendezVous).callCount(0)
        })
      })
      describe("quand le conseiller a choisi de ne pas recevoir d'invitation par email", () => {
        it('crée un rendez-vous sans envoyer un mail au conseiller', async () => {
          // Given
          const command: CreateRendezVousCommand = {
            idsJeunes: [jeune1.id],
            idConseiller: conseiller.id,
            commentaire: rendezVous.commentaire,
            date: rendezVous.date.toDateString(),
            duree: rendezVous.duree,
            invitation: false
          }

          rendezVousFactory.creer
            .withArgs(command, [jeune1], conseiller)
            .returns(success(rendezVous))

          // When
          const result = await createRendezVousCommandHandler.handle(command)
          // Then
          expect(result).to.deep.equal(success(rendezVous.id))
          expect(rendezVousRepository.save).to.have.been.calledWith(rendezVous)
          expect(
            notificationService.notifierLesJeunesDuRdv
          ).to.have.been.calledOnceWithExactly(
            rendezVous,
            Notification.Type.NEW_RENDEZVOUS
          )
          expect(mailClient.envoyerMailRendezVous).callCount(0)
        })
      })
    })
  })

  describe('authorize', () => {
    it('authorise un conseiller', async () => {
      // Given
      const command: CreateRendezVousCommand = {
        idsJeunes: [jeune1.id],
        idConseiller: conseiller.id,
        commentaire: rendezVous.commentaire,
        date: rendezVous.date.toDateString(),
        duree: rendezVous.duree
      }

      const utilisateur = unUtilisateurConseiller()

      // When
      await createRendezVousCommandHandler.authorize(command, utilisateur)

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(command.idConseiller, utilisateur)
    })
  })

  describe('monitor', () => {
    const utilisateur = unUtilisateurJeune()

    it("créé l'événement idoine quand c'etait un rdv", () => {
      // Given
      const command = {
        idsJeunes: [jeune1.id, jeune2.id],
        idConseiller: conseiller.id,
        commentaire: rendezVous.commentaire,
        date: rendezVous.date.toDateString(),
        duree: rendezVous.duree,
        modalite: 'tel'
      }

      // When
      createRendezVousCommandHandler.monitor(utilisateur, command)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.RDV_CREE,
        utilisateur
      )
    })

    it("créé l'événement idoine quand c'etait une AC", async () => {
      // Given
      const command = {
        idsJeunes: [jeune1.id, jeune2.id],
        idConseiller: conseiller.id,
        commentaire: rendezVous.commentaire,
        date: rendezVous.date.toDateString(),
        duree: rendezVous.duree,
        modalite: 'tel',
        type: CodeTypeRendezVous.ATELIER
      }

      // When
      await createRendezVousCommandHandler.monitor(utilisateur, command)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.ANIMATION_COLLECTIVE_CREEE,
        utilisateur
      )
    })
  })
})
