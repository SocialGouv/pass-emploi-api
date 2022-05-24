import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import { PlanificateurService } from '../../../src/domain/planificateur'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import {
  createSandbox,
  DatabaseForTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { RendezVous } from '../../../src/domain/rendez-vous'
import { Notification } from '../../../src/domain/notification'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'

import { Jeune } from '../../../src/domain/jeune'
import {
  CreateRendezVousCommand,
  CreateRendezVousCommandHandler
} from '../../../src/application/commands/create-rendez-vous.command.handler'
import { IdService } from '../../../src/utils/id-service'
import { EvenementService } from 'src/domain/evenement'
import { Mail } from '../../../src/domain/mail'
import { Conseiller } from 'src/domain/conseiller'
import { unConseiller } from 'test/fixtures/conseiller.fixture'
import { failure, success } from '../../../src/building-blocks/types/result'
import {
  JeuneNonLieAuConseillerError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'

describe('CreateRendezVousCommandHandler', () => {
  DatabaseForTesting.prepare()
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let notificationRepository: StubbedType<Notification.Service>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let planificateurService: StubbedClass<PlanificateurService>
  const conseillerAuthorizer = stubClass(ConseillerAuthorizer)
  let idService: StubbedClass<IdService>
  let createRendezVousCommandHandler: CreateRendezVousCommandHandler
  let evenementService: StubbedClass<EvenementService>
  let mailClient: StubbedType<Mail.Service>
  const jeune1 = unJeune({ id: 'jeune-1' })
  const jeune2 = unJeune({ id: 'jeune-2' })
  const rendezVous = unRendezVous({ jeunes: [jeune1] })

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)
    notificationRepository = stubInterface(sandbox)
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
      notificationRepository,
      mailClient,
      conseillerAuthorizer,
      planificateurService,
      evenementService
    )
  })

  describe('handle', () => {
    describe('erreurs', () => {
      it("renvoie une failure quand un des jeunes n'existe pas", async () => {
        // Given
        const command: CreateRendezVousCommand = {
          idsJeunes: [jeune1.id, jeune2.id],
          idConseiller: jeune1.conseiller.id,
          commentaire: rendezVous.commentaire,
          date: rendezVous.date.toDateString(),
          duree: rendezVous.duree,
          modalite: 'tel'
        }
        jeuneRepository.get.withArgs(jeune1.id).resolves(jeune1)
        jeuneRepository.get.withArgs(jeune2.id).resolves(undefined)

        // When
        const result = await createRendezVousCommandHandler.handle(command)
        // Then
        expect(rendezVousRepository.save).not.to.have.been.calledWith(
          rendezVous.id
        )
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', jeune2.id))
        )
      })
      it("renvoie une failure quad un des jeunes n'est pas lié au conseiller", async () => {
        // Given
        const command: CreateRendezVousCommand = {
          idsJeunes: [jeune1.id, jeune2.id],
          idConseiller: 'FAKE_CONSEILLER',
          commentaire: rendezVous.commentaire,
          date: rendezVous.date.toDateString(),
          duree: rendezVous.duree
        }
        jeuneRepository.get.withArgs(jeune1.id).resolves(jeune1)
        jeuneRepository.get.withArgs(jeune2.id).resolves(jeune2)

        // When
        const result = await createRendezVousCommandHandler.handle(command)
        // Then
        expect(rendezVousRepository.save).not.to.have.been.calledWith(
          rendezVous.id
        )
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
    describe('save : quand tous les jeunes existent et sont liés au bon conseiller', () => {
      it('crée un rendez-vous multi-bénéficiaires', async () => {
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
          jeune1.conseiller,
          idService
        )

        // When
        const result = await createRendezVousCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(success(expectedRendezvous.id))
        expect(rendezVousRepository.save).to.have.been.calledWith(
          expectedRendezvous
        )
      })
      it('est un succès quand la planification échoue', async () => {
        // Given
        const jeuneSansPushToken = unJeune({ pushNotificationToken: undefined })
        jeuneRepository.get
          .withArgs(jeuneSansPushToken.id)
          .resolves(jeuneSansPushToken)
        const command: CreateRendezVousCommand = {
          idsJeunes: [jeuneSansPushToken.id],
          idConseiller: jeuneSansPushToken.conseiller.id,
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
          [jeuneSansPushToken],
          conseiller,
          idService
        )
        // When
        const result = await createRendezVousCommandHandler.handle(command)
        // Then
        expect(result).to.deep.equal(success(expectedRendezvous.id))
      })
    })
    describe('notifications', () => {
      it("n'envoie pas de notification push à un jeune qui ne s'est jamais connecté", async () => {
        // Given
        const jeune = unJeune({ pushNotificationToken: undefined })
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
        await createRendezVousCommandHandler.handle(command)

        // Then
        expect(notificationRepository.envoyer).not.to.have.been.calledWith(
          Notification.createNouveauRdv(
            jeune.pushNotificationToken,
            expectedRendezvous.id
          )
        )
      })
      it("envoie une notification push à un jeune qui s'est déjà connecté", async () => {
        // Given
        const command: CreateRendezVousCommand = {
          idsJeunes: [jeune1.id],
          idConseiller: jeune1.conseiller.id,
          commentaire: rendezVous.commentaire,
          date: rendezVous.date.toDateString(),
          duree: rendezVous.duree,
          invitation: true
        }
        jeuneRepository.get.withArgs(jeune1.id).resolves(jeune1)

        conseillerRepository.get
          .withArgs(command.idConseiller)
          .resolves(jeune1.conseiller)

        const expectedRendezvous = RendezVous.createRendezVousConseiller(
          command,
          [jeune1],
          jeune1.conseiller,
          idService
        )

        // When
        await createRendezVousCommandHandler.handle(command)

        // Then
        expect(
          notificationRepository.envoyer
        ).to.have.been.calledOnceWithExactly(
          Notification.createNouveauRdv(
            jeune1.pushNotificationToken,
            expectedRendezvous.id
          )
        )
      })
      it('envoie un email a un conseiller qui a accepté les invitations', async () => {
        // Given
        const command: CreateRendezVousCommand = {
          idsJeunes: [jeune1.id],
          idConseiller: jeune1.conseiller.id,
          commentaire: rendezVous.commentaire,
          date: rendezVous.date.toDateString(),
          duree: rendezVous.duree,
          invitation: true
        }
        jeuneRepository.get.withArgs(jeune1.id).resolves(jeune1)

        conseillerRepository.get
          .withArgs(command.idConseiller)
          .resolves(jeune1.conseiller)

        const expectedRendezvous = RendezVous.createRendezVousConseiller(
          command,
          [jeune1],
          jeune1.conseiller,
          idService
        )
        // When
        await createRendezVousCommandHandler.handle(command)

        // Then
        expect(mailClient.envoyerMailRendezVous).to.have.been.calledWith(
          jeune1.conseiller,
          expectedRendezvous
        )
      })
      it("n'envoie pas d'email a un conseiller sans adresse renseignée", async () => {
        // Given
        jeuneRepository.get.withArgs(jeune1.id).resolves(jeune1)

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

        // When
        await createRendezVousCommandHandler.handle(command)
        // Then
        expect(mailClient.envoyerMailRendezVous).not.to.have.been.called()
      })
      it("n'envoie pas d'email a un conseiller qui a choisi de ne pas recevoir les recevoir", async () => {
        // Given
        jeuneRepository.get.withArgs(jeune1.id).resolves(jeune1)

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

        // When
        await createRendezVousCommandHandler.handle(command)
        // Then
        expect(mailClient.envoyerMailRendezVous).callCount(0)
      })
      it('planifie les rappels de rdv pour les jeunes', async () => {
        // Given
        const command: CreateRendezVousCommand = {
          idsJeunes: [jeune1.id],
          idConseiller: jeune1.conseiller.id,
          commentaire: rendezVous.commentaire,
          date: rendezVous.date.toDateString(),
          duree: rendezVous.duree,
          invitation: true
        }
        jeuneRepository.get.withArgs(jeune1.id).resolves(jeune1)

        conseillerRepository.get
          .withArgs(command.idConseiller)
          .resolves(jeune1.conseiller)

        const expectedRendezvous = RendezVous.createRendezVousConseiller(
          command,
          [jeune1],
          jeune1.conseiller,
          idService
        )

        // When
        await createRendezVousCommandHandler.handle(command)

        // Then
        expect(
          planificateurService.planifierRappelsRendezVous
        ).to.have.been.calledWith(expectedRendezvous)
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
