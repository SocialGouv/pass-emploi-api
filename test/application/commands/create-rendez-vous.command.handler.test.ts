import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import { PlanificateurService } from '../../../src/domain/planificateur'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { failure, success } from '../../../src/building-blocks/types/result'
import { CodeTypeRendezVous, RendezVous } from '../../../src/domain/rendez-vous'
import { Notification } from '../../../src/domain/notification/notification'
import { uneConfiguration, unJeune } from '../../fixtures/jeune.fixture'
import {
  ConseillerSansAgenceError,
  JeuneNonLieALAgenceError,
  JeuneNonLieAuConseillerError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { Jeune } from '../../../src/domain/jeune/jeune'
import {
  CreateRendezVousCommand,
  CreateRendezVousCommandHandler
} from '../../../src/application/commands/create-rendez-vous.command.handler'
import { IdService } from '../../../src/utils/id-service'
import { EvenementService } from 'src/domain/evenement'
import { Mail } from '../../../src/domain/mail'
import { Conseiller } from 'src/domain/conseiller'
import { unConseiller } from 'test/fixtures/conseiller.fixture'
import { stubClassSandbox } from 'test/utils/types'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'

describe('CreateRendezVousCommandHandler', () => {
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let notificationService: StubbedClass<Notification.Service>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let planificateurService: StubbedClass<PlanificateurService>
  const conseillerAuthorizer = stubClass(ConseillerAuthorizer)
  let idService: StubbedClass<IdService>
  let createRendezVousCommandHandler: CreateRendezVousCommandHandler
  let evenementService: StubbedClass<EvenementService>
  let mailClient: StubbedType<Mail.Service>
  const jeune1 = unJeune({
    id: 'jeune-1',
    configuration: uneConfiguration({ idJeune: 'jeune-1' })
  })
  const jeune2 = unJeune({
    id: 'jeune-2',
    configuration: uneConfiguration({ idJeune: 'jeune-2' })
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
    idService = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)
    mailClient = stubInterface(sandbox)

    createRendezVousCommandHandler = new CreateRendezVousCommandHandler(
      idService,
      rendezVousRepository,
      jeuneRepository,
      conseillerRepository,
      notificationService,
      mailClient,
      conseillerAuthorizer,
      planificateurService,
      evenementService
    )
  })

  describe('handle', () => {
    describe('RendezVous de type animation collective', () => {
      it('renvoie une failure quand le conseiller est sans agence', async () => {
        // Given
        const command: CreateRendezVousCommand = {
          idsJeunes: [],
          idConseiller: 'FAKE_CONSEILLER',
          commentaire: rendezVous.commentaire,
          date: rendezVous.date.toDateString(),
          duree: rendezVous.duree,
          type: CodeTypeRendezVous.ATELIER
        }
        conseillerRepository.get
          .withArgs(command.idConseiller)
          .resolves(unConseiller({ agence: { id: undefined } }))

        // When
        const result = await createRendezVousCommandHandler.handle(command)
        // Then
        expect(result).to.deep.equal(
          failure(new ConseillerSansAgenceError(command.idConseiller))
        )
      })
      it("renvoie une failure quand un des jeunes n'a pas la meme agence que le conseiller", async () => {
        // Given
        const command: CreateRendezVousCommand = {
          idsJeunes: [jeune1.id],
          idConseiller: 'FAKE_CONSEILLER',
          commentaire: rendezVous.commentaire,
          date: rendezVous.date.toDateString(),
          duree: rendezVous.duree,
          type: CodeTypeRendezVous.ATELIER
        }
        conseillerRepository.get
          .withArgs(command.idConseiller)
          .resolves(unConseiller({ agence: { id: 'test' } }))
        jeuneRepository.get.withArgs(jeune1.id).resolves(jeune1)

        // When
        const result = await createRendezVousCommandHandler.handle(command)
        // Then
        expect(result).to.deep.equal(
          failure(new JeuneNonLieALAgenceError(jeune1.id, 'test'))
        )
      })
      it('renvoie un succes quand les jeunes ont la meme agence que le conseiller', async () => {
        // Given
        const jeune = unJeune()
        jeune.conseiller.idAgence = 'test'

        const conseiller = unConseiller({
          id: 'un-autre-conseiller',
          agence: { id: 'test' }
        })

        const command: CreateRendezVousCommand = {
          idsJeunes: [jeune.id],
          idConseiller: conseiller.id,
          commentaire: rendezVous.commentaire,
          date: rendezVous.date.toDateString(),
          duree: rendezVous.duree,
          type: CodeTypeRendezVous.ATELIER
        }
        conseillerRepository.get
          .withArgs(command.idConseiller)
          .resolves(conseiller)
        jeuneRepository.get.withArgs(jeune.id).resolves(jeune)

        const expectedRendezvous = RendezVous.createRendezVousConseiller(
          command,
          [jeune],
          unConseiller(),
          idService
        )

        // When
        const result = await createRendezVousCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(success(expectedRendezvous.id))
      })
    })
    describe("quand un des jeunes n'existe pas", () => {
      it('renvoie une failure', async () => {
        // Given
        const command: CreateRendezVousCommand = {
          idsJeunes: [jeune1.id, jeune2.id],
          idConseiller: jeune1.conseiller.id,
          commentaire: rendezVous.commentaire,
          date: rendezVous.date.toDateString(),
          duree: rendezVous.duree,
          modalite: 'tel'
        }
        conseillerRepository.get
          .withArgs(command.idConseiller)
          .resolves(jeune1.conseiller)
        jeuneRepository.get.withArgs(jeune1.id).resolves(jeune1)
        jeuneRepository.get.withArgs(jeune2.id).resolves(undefined)

        // When
        const result = await createRendezVousCommandHandler.handle(command)
        // Then
        expect(rendezVousRepository.save).not.to.have.been.calledWith(
          rendezVous.id
        )
        expect(notificationService.notifierLesJeunesDuRdv).to.have.callCount(0)
        expect(mailClient.envoyerMailRendezVous).callCount(0)
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', jeune2.id))
        )
      })
    })
    describe("quand un des jeunes n'est pas lié au conseiller", () => {
      it('renvoie une failure', async () => {
        // Given
        const command: CreateRendezVousCommand = {
          idsJeunes: [jeune1.id, jeune2.id],
          idConseiller: 'FAKE_CONSEILLER',
          commentaire: rendezVous.commentaire,
          date: rendezVous.date.toDateString(),
          duree: rendezVous.duree
        }
        conseillerRepository.get
          .withArgs(command.idConseiller)
          .resolves(jeune1.conseiller)
        jeuneRepository.get.withArgs(jeune1.id).resolves(jeune1)
        jeuneRepository.get.withArgs(jeune2.id).resolves(jeune2)

        // When
        const result = await createRendezVousCommandHandler.handle(command)
        // Then
        expect(rendezVousRepository.save).not.to.have.been.calledWith(
          rendezVous.id
        )
        expect(notificationService.notifierLesJeunesDuRdv).to.have.callCount(0)
        expect(mailClient.envoyerMailRendezVous).callCount(0)
        expect(result).to.deep.equal(
          failure(
            new JeuneNonLieAuConseillerError(
              command.idConseiller,
              command.idsJeunes[0]
            )
          )
        )
      })
    })
    describe('quand tous les jeunes existent et sont liés au bon conseiller', () => {
      describe("quand le jeune s'est connecté au moins une fois sur l'application", () => {
        it('crée un rendez-vous, envoie une notification au jeune, envoie un mail au conseiller et planifie', async () => {
          // Given
          const command: CreateRendezVousCommand = {
            idsJeunes: [jeune1.id, jeune2.id],
            idConseiller: jeune1.conseiller.id,
            commentaire: rendezVous.commentaire,
            date: rendezVous.date.toDateString(),
            duree: rendezVous.duree,
            invitation: true
          }
          jeuneRepository.get.withArgs(jeune1.id).resolves(jeune1)
          jeuneRepository.get.withArgs(jeune2.id).resolves(jeune2)

          conseillerRepository.get
            .withArgs(command.idConseiller)
            .resolves(jeune1.conseiller)

          const expectedRendezvous = RendezVous.createRendezVousConseiller(
            command,
            [jeune1, jeune2],
            unConseiller(),
            idService
          )

          // When
          const result = await createRendezVousCommandHandler.handle(command)

          // Then
          expect(result).to.deep.equal(success(expectedRendezvous.id))
          expect(rendezVousRepository.save).to.have.been.calledWith(
            expectedRendezvous
          )
          expect(
            notificationService.notifierLesJeunesDuRdv
          ).to.have.been.calledOnceWithExactly(
            expectedRendezvous,
            Notification.Type.NEW_RENDEZVOUS
          )
          expect(mailClient.envoyerMailRendezVous).to.have.been.calledWith(
            jeune1.conseiller,
            expectedRendezvous
          )
          expect(
            planificateurService.planifierRappelsRendezVous
          ).to.have.been.calledWith(expectedRendezvous)
        })
      })
      describe("quand un jeune ne s'est jamais connecté sur l'application", () => {
        it('crée un rendez-vous et envoie un mail au conseiller sans envoyer de notifications au jeune', async () => {
          // Given
          const jeune = unJeune({
            configuration: {
              idJeune: unJeune().id,
              pushNotificationToken: undefined
            }
          })
          jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
          const command: CreateRendezVousCommand = {
            idsJeunes: [jeune.id],
            idConseiller: jeune.conseiller.id,
            commentaire: rendezVous.commentaire,
            date: rendezVous.date.toDateString(),
            duree: rendezVous.duree,
            invitation: true
          }
          const conseiller = unConseiller()
          conseillerRepository.get
            .withArgs(command.idConseiller)
            .resolves(conseiller)
          const expectedRendezvous = RendezVous.createRendezVousConseiller(
            command,
            [jeune],
            conseiller,
            idService
          )
          // When
          const result = await createRendezVousCommandHandler.handle(command)
          // Then
          expect(result).to.deep.equal(success(expectedRendezvous.id))
          expect(rendezVousRepository.save).to.have.been.calledWith(
            expectedRendezvous
          )
          expect(
            notificationService.notifierLesJeunesDuRdv
          ).to.have.been.calledOnceWithExactly(
            expectedRendezvous,
            Notification.Type.NEW_RENDEZVOUS
          )
          expect(mailClient.envoyerMailRendezVous).to.have.been.calledWith(
            unConseiller(),
            expectedRendezvous
          )
        })
      })
      describe("quand le conseiller n'a pas d'email", () => {
        it('crée un rendez-vous sans envoyer un mail au conseiller', async () => {
          // Given
          jeuneRepository.get.withArgs(jeune1.id).resolves(jeune1)
          rendezVous.jeunes[0].configuration!.pushNotificationToken = undefined

          const command: CreateRendezVousCommand = {
            idsJeunes: [jeune1.id],
            idConseiller: jeune1.conseiller.id,
            commentaire: rendezVous.commentaire,
            date: rendezVous.date.toDateString(),
            duree: rendezVous.duree,
            invitation: true
          }
          const conseiller: Conseiller = {
            ...unConseiller(),
            email: undefined
          }
          conseillerRepository.get
            .withArgs(command.idConseiller)
            .resolves(conseiller)

          const expectedRendezvous = RendezVous.createRendezVousConseiller(
            command,
            [jeune1],
            conseiller,
            idService
          )
          // When
          const result = await createRendezVousCommandHandler.handle(command)
          // Then
          expect(result).to.deep.equal(success(expectedRendezvous.id))
          expect(rendezVousRepository.save).to.have.been.calledWith(
            expectedRendezvous
          )
          expect(
            notificationService.notifierLesJeunesDuRdv
          ).to.have.been.calledOnceWithExactly(
            expectedRendezvous,
            Notification.Type.NEW_RENDEZVOUS
          )
          expect(mailClient.envoyerMailRendezVous).callCount(0)
        })
      })
      describe("quand le conseiller a choisi de ne pas recevoir d'invitation par email", () => {
        it('crée un rendez-vous sans envoyer un mail au conseiller', async () => {
          // Given
          jeuneRepository.get.withArgs(jeune1.id).resolves(jeune1)
          rendezVous.jeunes[0].configuration!.pushNotificationToken = undefined

          const command: CreateRendezVousCommand = {
            idsJeunes: [jeune1.id],
            idConseiller: jeune1.conseiller.id,
            commentaire: rendezVous.commentaire,
            date: rendezVous.date.toDateString(),
            duree: rendezVous.duree,
            invitation: false
          }
          const conseiller: Conseiller = unConseiller()

          conseillerRepository.get
            .withArgs(command.idConseiller)
            .resolves(conseiller)

          const expectedRendezvous = RendezVous.createRendezVousConseiller(
            command,
            [jeune1],
            conseiller,
            idService
          )
          // When
          const result = await createRendezVousCommandHandler.handle(command)
          // Then
          expect(result).to.deep.equal(success(expectedRendezvous.id))
          expect(rendezVousRepository.save).to.have.been.calledWith(
            expectedRendezvous
          )
          expect(
            notificationService.notifierLesJeunesDuRdv
          ).to.have.been.calledOnceWithExactly(
            expectedRendezvous,
            Notification.Type.NEW_RENDEZVOUS
          )
          expect(mailClient.envoyerMailRendezVous).callCount(0)
        })
      })
      describe('quand le la planification des notifications échoue', () => {
        it('renvoie un succès', async () => {
          // Given
          jeuneRepository.get.withArgs(jeune1.id).resolves(jeune1)
          rendezVous.jeunes[0].configuration!.pushNotificationToken = undefined

          const command: CreateRendezVousCommand = {
            idsJeunes: [jeune1.id],
            idConseiller: jeune1.conseiller.id,
            commentaire: rendezVous.commentaire,
            date: rendezVous.date.toDateString(),
            duree: rendezVous.duree
          }
          const conseiller = unConseiller()
          conseillerRepository.get
            .withArgs(command.idConseiller)
            .resolves(conseiller)
          planificateurService.planifierRappelsRendezVous.rejects(new Error())
          const expectedRendezvous = RendezVous.createRendezVousConseiller(
            command,
            [jeune1],
            conseiller,
            idService
          )
          // When
          const result = await createRendezVousCommandHandler.handle(command)
          // Then
          expect(result).to.deep.equal(success(expectedRendezvous.id))
        })
      })
    })
  })

  describe('authorize', () => {
    it('authorise un conseiller', async () => {
      // Given
      const command: CreateRendezVousCommand = {
        idsJeunes: [jeune1.id],
        idConseiller: jeune1.conseiller.id,
        commentaire: rendezVous.commentaire,
        date: rendezVous.date.toDateString(),
        duree: rendezVous.duree
      }

      const utilisateur = unUtilisateurConseiller()

      // When
      await createRendezVousCommandHandler.authorize(command, utilisateur)

      // Then
      expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idConseiller,
        utilisateur
      )
    })
  })
})
