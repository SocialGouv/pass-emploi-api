import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { RendezVousAuthorizer } from 'src/application/authorizers/authorize-rendezvous'
import {
  UpdateRendezVousCommand,
  UpdateRendezVousCommandHandler
} from 'src/application/commands/update-rendez-vous.command.handler'
import { Evenement, EvenementService } from 'src/domain/evenement'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Notification } from '../../../src/domain/notification/notification'
import { PlanificateurService } from '../../../src/domain/planificateur'
import { CodeTypeRendezVous, RendezVous } from '../../../src/domain/rendez-vous'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { Conseiller } from '../../../src/domain/conseiller'
import { Mail } from '../../../src/domain/mail'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { uneDate, uneDatetime } from '../../fixtures/date.fixture'
import { Authentification } from '../../../src/domain/authentification'

describe('UpdateRendezVousCommandHandler', () => {
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
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

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
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
        const result = await updateRendezVousCommandHandler.handle(command)
        // Then
        expect(rendezVousRepository.save).to.have.callCount(0)
        expect(notificationService.notifierLesJeunesDuRdv).to.have.callCount(0)
        expect(result).to.deep.equal(
          failure(new NonTrouveError('RendezVous', command.idRendezVous))
        )
      })
      it('échoue si la présence conseiller est à false pour un ENTRETIEN_INDIVIDUEL', async () => {
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
        expect(notificationService.notifierLesJeunesDuRdv).to.have.callCount(0)
        expect(result).to.deep.equal(
          failure(
            new MauvaiseCommandeError(
              'Le champ presenceConseiller ne peut être modifié pour un rendez-vous Conseiller.'
            )
          )
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
        jeuneRepository.get.withArgs(idJeuneNonTrouve).resolves(undefined)

        // When
        const result = await updateRendezVousCommandHandler.handle(command)
        // Then
        expect(rendezVousRepository.save).to.have.callCount(0)
        expect(notificationService.notifierLesJeunesDuRdv).to.have.callCount(0)
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', idJeuneNonTrouve))
        )
      })
      it('échoue si animation collective cloturée', async () => {
        // Given
        const animationCollective = unRendezVous({
          jeunes: [],
          type: CodeTypeRendezVous.ATELIER,
          dateCloture: uneDatetime()
        })

        const command: UpdateRendezVousCommand = {
          idsJeunes: ['x'],
          idRendezVous: animationCollective.id,
          date: '2021-11-11T08:03:30.000Z',
          duree: 30,
          presenceConseiller: false
        }
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(animationCollective)
        // When
        const result = await updateRendezVousCommandHandler.handle(command)
        // Then
        expect(rendezVousRepository.save).to.have.callCount(0)
        expect(notificationService.notifierLesJeunesDuRdv).to.have.callCount(0)
        expect(result).to.deep.equal(
          failure(
            new MauvaiseCommandeError(
              'Une Animation Collective cloturée ne peut plus etre modifiée.'
            )
          )
        )
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
      beforeEach(() => {
        command.idsJeunes = [jeune.id]
        rendezVous.jeunes = [jeune]
      })
      afterEach(() => {
        command.date = rendezVous.date.toISOString()
      })
      it('met à jour la date du rendez-vous', async () => {
        // Given
        const date = '2022-04-04T09:54:04.561Z'
        command.date = date
        const rendezVousUpdated: RendezVous = {
          ...rendezVous,
          date: new Date(date)
        }
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVous)
        jeuneRepository.get.withArgs(command.idsJeunes![0]).resolves(jeune)

        // When
        const result = await updateRendezVousCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(success({ id: rendezVousUpdated.id }))
        expect(rendezVousRepository.save).to.have.been.calledWith(
          rendezVousUpdated
        )
      })
      it('ajoute un jeune', async () => {
        // Given
        const jeuneInchange = unJeune({ id: 'jeuneInchange' })
        const jeuneAjoute = unJeune({ id: 'jeuneAjoute' })
        rendezVous.jeunes = [jeuneInchange]
        command.idsJeunes = [jeuneInchange.id, jeuneAjoute.id]
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVous)
        jeuneRepository.get
          .withArgs(command.idsJeunes[0])
          .resolves(jeuneInchange)
        jeuneRepository.get.withArgs(command.idsJeunes[1]).resolves(jeuneAjoute)
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
      })
      it('supprime un jeune', async () => {
        // Given
        const jeuneInchange = unJeune({ id: 'jeuneInchange' })
        const jeuneSupprime = unJeune({ id: 'jeuneSupprime' })
        rendezVous.jeunes = [jeuneInchange, jeuneSupprime]
        command.idsJeunes = [jeuneInchange.id]
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVous)
        jeuneRepository.get
          .withArgs(command.idsJeunes[0])
          .resolves(jeuneInchange)
        const rendezVousUpdated: RendezVous = {
          ...rendezVous,
          jeunes: [jeuneInchange]
        }
        // When
        const result = await updateRendezVousCommandHandler.handle(command)
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
      beforeEach(() => {
        command.idsJeunes = [jeune.id]
        rendezVous.jeunes = [jeune]
      })
      afterEach(() => {
        command.date = rendezVous.date.toISOString()
      })

      it("n'envoie aucun email au conseiller créateur si le champ invitation est false", async () => {
        // Given
        rendezVous.invitation = false
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVous)
        jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
        // When
        await updateRendezVousCommandHandler.handle(command)
        // Then
        expect(mailService.envoyerMailRendezVous).not.to.have.been.called()
      })
      it('envoie un email au conseiller créateur si le champ invitation est true', async () => {
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
      it("ne replanifie pas les rappels et n'envoie pas la notif push aux jeunes inchangés si pas de modifs des infos du rendez-vous", async () => {
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
        await updateRendezVousCommandHandler.handle(command)
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
        const date = '2022-04-04T09:54:04.561Z'
        command.date = date
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVous)
        jeuneRepository.get.withArgs(command.idsJeunes![0]).resolves(jeune)
        const rendezVousUpdated: RendezVous = {
          ...rendezVous,
          jeunes: [jeune],
          date: new Date(date)
        }
        // When
        await updateRendezVousCommandHandler.handle(command)

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
      })
      it('notifie les jeunes ajoutés de la création du rendez-vous pour leur ajout dans la liste des bénéficiaires', async () => {
        // Given
        const jeuneAjoute = unJeune({ id: 'jeuneAjoute' })
        rendezVous.jeunes = [jeune]
        command.idsJeunes = [jeune.id, jeuneAjoute.id]
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVous)
        jeuneRepository.get.withArgs(command.idsJeunes[0]).resolves(jeune)
        jeuneRepository.get.withArgs(command.idsJeunes[1]).resolves(jeuneAjoute)

        // When
        await updateRendezVousCommandHandler.handle(command)
        // Then
        expect(
          notificationService.notifierLesJeunesDuRdv
        ).to.have.been.calledWith(
          { ...rendezVous, jeunes: [jeuneAjoute] },
          Notification.Type.NEW_RENDEZVOUS
        )
      })
      it('notifie les jeunes supprimés de la suppression du rendez-vous pour leur retrait de la liste des bénéficiaires', async () => {
        // Given
        const jeuneSupprime = unJeune({ id: 'jeuneSupprime' })
        rendezVous.jeunes = [jeune, jeuneSupprime]
        command.idsJeunes = [jeune.id]
        rendezVousRepository.get
          .withArgs(command.idRendezVous)
          .resolves(rendezVous)
        jeuneRepository.get.withArgs(command.idsJeunes[0]).resolves(jeune)
        jeuneRepository.get
          .withArgs(command.idsJeunes[1])
          .resolves(jeuneSupprime)
        // When
        await updateRendezVousCommandHandler.handle(command)
        // Then
        expect(
          notificationService.notifierLesJeunesDuRdv
        ).to.have.been.calledWith(
          { ...rendezVous, jeunes: [jeuneSupprime] },
          Notification.Type.DELETED_RENDEZVOUS
        )
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
        date: date.toISOString(),
        duree: 30,
        presenceConseiller: rendezVous.presenceConseiller
      }
    })

    it("créé l'événement idoine", async () => {
      // When
      await updateRendezVousCommandHandler.monitor(utilisateur, updateCommand)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.RDV_MODIFIE,
        utilisateur
      )
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
