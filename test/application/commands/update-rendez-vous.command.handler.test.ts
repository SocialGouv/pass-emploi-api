import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { RendezVousAuthorizer } from 'src/application/authorizers/rendezvous-authorizer'
import {
  UpdateRendezVousCommand,
  UpdateRendezVousCommandHandler
} from 'src/application/commands/update-rendez-vous.command.handler'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Notification } from '../../../src/domain/notification/notification'
import { PlanificateurService } from '../../../src/domain/planificateur'
import {
  CodeTypeRendezVous,
  RendezVous
} from '../../../src/domain/rendez-vous/rendez-vous'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { Conseiller } from '../../../src/domain/milo/conseiller'
import { Mail } from '../../../src/domain/mail'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { uneDate } from '../../fixtures/date.fixture'
import { Authentification } from '../../../src/domain/authentification'

describe('UpdateRendezVousCommandHandler', () => {
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let rendezVousFactory: StubbedClass<RendezVous.Factory>
  let notificationService: StubbedClass<Notification.Service>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let mailService: StubbedType<Mail.Service>
  let planificateurService: StubbedClass<PlanificateurService>
  let rendezVousAuthorizer = stubClass(RendezVousAuthorizer)
  let evenementService: StubbedClass<EvenementService>
  let historiqueRendezVousFactory: StubbedClass<RendezVous.Historique.Factory>
  let historiqueRendezVousRepository: StubbedType<RendezVous.Historique.Repository>
  let updateRendezVousCommandHandler: UpdateRendezVousCommandHandler
  const jeune = unJeune()
  const rendezVous = unRendezVous({ jeunes: [jeune] })
  const utilisateur = unUtilisateurConseiller()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    rendezVousFactory = stubClass(RendezVous.Factory)
    notificationService = stubClass(Notification.Service)
    conseillerRepository = stubInterface(sandbox)
    mailService = stubInterface(sandbox)
    rendezVousAuthorizer = stubClass(RendezVousAuthorizer)
    planificateurService = stubClass(PlanificateurService)
    evenementService = stubClass(EvenementService)
    historiqueRendezVousFactory = stubClass(RendezVous.Historique.Factory)
    historiqueRendezVousRepository = stubInterface(sandbox)

    updateRendezVousCommandHandler = new UpdateRendezVousCommandHandler(
      rendezVousRepository,
      jeuneRepository,
      rendezVousFactory,
      notificationService,
      mailService,
      conseillerRepository,
      rendezVousAuthorizer,
      planificateurService,
      evenementService,
      historiqueRendezVousFactory,
      historiqueRendezVousRepository
    )
  })

  describe('handle', () => {
    describe('erreurs', () => {
      it('échoue si rendez-vous inexistant', async () => {
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
        const result = await updateRendezVousCommandHandler.handle(
          command,
          utilisateur
        )
        // Then
        expect(rendezVousRepository.save).to.have.callCount(0)
        expect(notificationService.notifierLesJeunesDuRdv).to.have.callCount(0)
        expect(result).to.deep.equal(
          failure(new NonTrouveError('RendezVous', command.idRendezVous))
        )
      })
      it("échoue si un jeune de la liste n'est pas trouvé", async () => {
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
        jeuneRepository.findAll.withArgs([idJeuneNonTrouve]).resolves([])

        // When
        const result = await updateRendezVousCommandHandler.handle(
          command,
          utilisateur
        )
        // Then
        expect(rendezVousRepository.save).to.have.callCount(0)
        expect(notificationService.notifierLesJeunesDuRdv).to.have.callCount(0)
        expect(result).to.deep.equal(failure(new NonTrouveError('Jeune')))
      })
    })
    describe('save : quand tous les jeunes de la liste sont trouvés', () => {
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

      it('met à jour le rendez vous', async () => {
        // Given
        const rendezVousUpdated: RendezVous = {
          ...rendezVous,
          date: new Date('2022-04-04T09:54:04.561Z')
        }
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVous)
        jeuneRepository.findAll.withArgs(command.idsJeunes).resolves([jeune])

        rendezVousFactory.mettreAJour
          .withArgs(rendezVous, { ...command, jeunes: [jeune] })
          .returns(success(rendezVousUpdated))

        // When
        const result = await updateRendezVousCommandHandler.handle(
          command,
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(success({ id: rendezVousUpdated.id }))
        expect(rendezVousRepository.save).to.have.been.calledWith(
          rendezVousUpdated
        )
      })
    })

    describe('notifications', () => {
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

      it("n'envoie aucun email au conseiller créateur si le champ invitation est false", async () => {
        // Given
        const rendezVousSansInvitation: RendezVous = {
          ...rendezVous,
          invitation: false
        }
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVousSansInvitation)
        jeuneRepository.findAll.withArgs([jeune.id]).resolves([jeune])

        rendezVousFactory.mettreAJour
          .withArgs(rendezVousSansInvitation, { ...command, jeunes: [jeune] })
          .returns(success(rendezVousSansInvitation))

        // When
        await updateRendezVousCommandHandler.handle(command, utilisateur)

        // Then
        expect(mailService.envoyerMailRendezVous).not.to.have.been.called()
      })
      it('envoie un email au conseiller créateur si le champ invitation est true', async () => {
        // Given
        const rendezVousAvecInvitation: RendezVous = {
          ...rendezVous,
          invitation: true
        }

        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVousAvecInvitation)

        jeuneRepository.findAll.withArgs([jeune.id]).resolves([jeune])
        const rendezVousUpdated: RendezVous = {
          ...rendezVousAvecInvitation,
          date: new Date('2022-04-04T09:54:04.561Z')
        }
        conseillerRepository.get
          .withArgs(rendezVousUpdated.createur.id)
          .resolves(rendezVousUpdated.jeunes[0].conseiller)
        rendezVousFactory.mettreAJour
          .withArgs(rendezVousAvecInvitation, { ...command, jeunes: [jeune] })
          .returns(success(rendezVousUpdated))

        // When
        await updateRendezVousCommandHandler.handle(command, utilisateur)

        // Then
        expect(
          mailService.envoyerMailRendezVous
        ).to.have.been.calledWithExactly(
          rendezVousUpdated.jeunes[0].conseiller,
          rendezVousUpdated,
          RendezVous.Operation.MODIFICATION
        )
      })
      it("ne replanifie pas les rappels et n'envoie pas la notif push aux jeunes inchangés si pas de modifs des infos du rendez-vous", async () => {
        // Given
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVous)
        jeuneRepository.findAll.withArgs([jeune.id]).resolves([jeune])
        const rendezVousUpdated: RendezVous = {
          ...rendezVous,
          date: rendezVous.date
        }
        rendezVousFactory.mettreAJour
          .withArgs(rendezVous, { ...command, jeunes: [jeune] })
          .returns(success(rendezVousUpdated))

        // When
        await updateRendezVousCommandHandler.handle(command, utilisateur)

        // Then
        expect(
          notificationService.notifierLesJeunesDuRdv
        ).not.to.have.been.calledWith(
          rendezVous,
          Notification.Type.UPDATED_RENDEZVOUS
        )
        expect(
          planificateurService.supprimerRappelsParId
        ).not.to.have.been.calledWith(rendezVousUpdated.id)
        expect(
          planificateurService.planifierRappelsRendezVous
        ).not.to.have.been.calledWith(rendezVousUpdated)
      })
      it('replanifie les rappels et notifie les jeunes inchangés de la modification de la date du rendez-vous', async () => {
        // Given
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVous)
        jeuneRepository.findAll.withArgs(command.idsJeunes).resolves([jeune])
        const rendezVousUpdated: RendezVous = {
          ...rendezVous,
          jeunes: [jeune],
          date: new Date('2022-05-04T09:54:04.561Z')
        }
        rendezVousFactory.mettreAJour
          .withArgs(rendezVous, { ...command, jeunes: [jeune] })
          .returns(success(rendezVousUpdated))

        // When
        await updateRendezVousCommandHandler.handle(command, utilisateur)

        // Then
        expect(
          notificationService.notifierLesJeunesDuRdv
        ).to.have.been.calledWith(
          { ...rendezVous, jeunes: [jeune] },
          Notification.Type.UPDATED_RENDEZVOUS
        )
        expect(
          planificateurService.supprimerRappelsParId
        ).to.have.been.calledWith(rendezVousUpdated.id)
        expect(
          planificateurService.planifierRappelsRendezVous
        ).to.have.been.calledWith(rendezVousUpdated)
        expect(evenementService.creer).to.have.been.calledOnceWithExactly(
          Evenement.Code.RDV_MODIFIE,
          utilisateur
        )
      })
      it('notifie les jeunes ajoutés de la création du rendez-vous pour leur ajout dans la liste des bénéficiaires', async () => {
        // Given
        const jeuneAjoute = unJeune({ id: 'jeuneAjoute' })
        const commandAvecUnJeuneEnPlus: UpdateRendezVousCommand = {
          ...command,
          idsJeunes: [jeune.id, jeuneAjoute.id]
        }
        const rendezVousInitial: RendezVous = {
          ...rendezVous,
          type: CodeTypeRendezVous.ATELIER,
          jeunes: [jeune]
        }
        const rendezVousUpdated: RendezVous = {
          ...rendezVous,
          type: CodeTypeRendezVous.ATELIER,
          jeunes: [jeune, jeuneAjoute]
        }
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVousInitial)
        jeuneRepository.findAll
          .withArgs(commandAvecUnJeuneEnPlus.idsJeunes)
          .resolves([jeune, jeuneAjoute])
        jeuneRepository.get.withArgs(jeuneAjoute.id).resolves(jeuneAjoute)
        rendezVousFactory.mettreAJour
          .withArgs(rendezVousInitial, {
            ...commandAvecUnJeuneEnPlus,
            jeunes: [jeune, jeuneAjoute]
          })
          .returns(success(rendezVousUpdated))

        // When
        await updateRendezVousCommandHandler.handle(
          commandAvecUnJeuneEnPlus,
          utilisateur
        )

        // Then
        expect(
          notificationService.notifierLesJeunesDuRdv
        ).to.have.been.calledWith(
          { ...rendezVousUpdated, jeunes: [jeuneAjoute] },
          Notification.Type.NEW_RENDEZVOUS
        )
        expect(evenementService.creer).to.have.been.calledOnceWithExactly(
          Evenement.Code.ANIMATION_COLLECTIVE_INSCRIPTION,
          utilisateur
        )
      })
      it('notifie les jeunes supprimés de la suppression du rendez-vous pour leur retrait de la liste des bénéficiaires', async () => {
        // Given
        const jeuneSupprime = unJeune({ id: 'jeuneSupprime' })
        const commandAvecUnJeuneEnMoins: UpdateRendezVousCommand = {
          ...command,
          idsJeunes: [jeune.id]
        }
        const rendezVousInitial: RendezVous = {
          ...rendezVous,
          jeunes: [jeune, jeuneSupprime]
        }

        const rendezVousUpdated: RendezVous = {
          ...rendezVous,
          jeunes: [jeune]
        }
        rendezVousRepository.get
          .withArgs(commandAvecUnJeuneEnMoins.idRendezVous)
          .resolves(rendezVousInitial)
        jeuneRepository.findAll
          .withArgs(commandAvecUnJeuneEnMoins.idsJeunes)
          .resolves([jeune])
        rendezVousFactory.mettreAJour
          .withArgs(rendezVousInitial, {
            ...commandAvecUnJeuneEnMoins,
            jeunes: [jeune]
          })
          .returns(success(rendezVousUpdated))

        // When
        await updateRendezVousCommandHandler.handle(
          commandAvecUnJeuneEnMoins,
          utilisateur
        )
        // Then
        expect(
          notificationService.notifierLesJeunesDuRdv
        ).to.have.been.calledWith(
          { ...rendezVousUpdated, jeunes: [jeuneSupprime] },
          Notification.Type.DELETED_RENDEZVOUS
        )
      })
    })
  })

  describe('authorize', () => {
    it('autorise un conseiller', async () => {
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
      expect(
        rendezVousAuthorizer.autoriserConseillerPourUnRendezVousAvecAuMoinsUnJeune
      ).to.have.been.calledWithExactly(command.idRendezVous, utilisateur)
    })
  })

  describe('monitor', () => {
    let utilisateur: Authentification.Utilisateur
    let updateCommand: UpdateRendezVousCommand
    let date: Date

    // Given
    beforeEach(() => {
      utilisateur = unUtilisateurConseiller()
      date = uneDate()
      updateCommand = {
        idRendezVous: rendezVous.id,
        idsJeunes: ['x'],
        date: date.toISOString(),
        duree: 30,
        presenceConseiller: rendezVous.presenceConseiller
      }
    })

    it("ne crée pas l'événement idoine", async () => {
      // When
      await updateRendezVousCommandHandler.monitor(utilisateur, updateCommand)

      // Then
      expect(evenementService.creer).not.to.have.been.called()
    })

    it('crée un log de modification de rendez-vous', async () => {
      // Given
      const logModification = {
        id: '37b4ca73-fd8b-4194-8d3c-80b6c9949dea',
        idRendezVous: rendezVous.id,
        date,
        auteur: {
          id: utilisateur.id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom
        }
      }
      historiqueRendezVousFactory.creerLogModification
        .withArgs(updateCommand.idRendezVous, utilisateur)
        .returns(logModification)

      // When
      await updateRendezVousCommandHandler.monitor(utilisateur, updateCommand)

      // Then
      expect(
        historiqueRendezVousRepository.save
      ).to.have.been.calledWithExactly(logModification)
    })
  })
})
