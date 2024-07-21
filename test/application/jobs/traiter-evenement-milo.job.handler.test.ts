import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import {
  Traitement,
  TraiterEvenementMiloJobHandler
} from '../../../src/application/jobs/traiter-evenement-milo.job.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { EvenementMilo } from '../../../src/domain/milo/evenement.milo'
import { JeuneMilo } from '../../../src/domain/milo/jeune.milo'
import { RendezVousMilo } from '../../../src/domain/milo/rendez-vous.milo'
import { SessionMilo } from '../../../src/domain/milo/session.milo'
import { Notification } from '../../../src/domain/notification/notification'
import {
  Planificateur,
  PlanificateurService
} from '../../../src/domain/planificateur'
import {
  CodeTypeRendezVous,
  RendezVous
} from '../../../src/domain/rendez-vous/rendez-vous'
import { SuiviJob } from '../../../src/domain/suivi-job'
import { DateService } from '../../../src/utils/date-service'
import { uneDate, uneDatetime } from '../../fixtures/date.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import {
  unEvenementMilo,
  unRendezVousMilo,
  uneInstanceSessionMilo
} from '../../fixtures/milo.fixture'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { StubbedClass, expect, stubClass } from '../../utils'
import { testConfig } from '../../utils/module-for-testing'

describe('TraiterEvenementMiloJobHandler', () => {
  let handler: TraiterEvenementMiloJobHandler
  let suiviJobService: StubbedType<SuiviJob.Service>
  let dateService: StubbedClass<DateService>
  let jeuneRepository: StubbedType<JeuneMilo.Repository>
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let sessionMiloRepository: StubbedType<SessionMilo.Repository>
  let miloRendezVousRepository: StubbedType<RendezVousMilo.Repository>
  let rendezVousMiloFactory: StubbedClass<RendezVousMilo.Factory>
  let notificationService: StubbedClass<Notification.Service>
  let planificateurService: StubbedClass<PlanificateurService>

  const maintenant = uneDatetime()

  const jeune: JeuneMilo = {
    ...unJeune(),
    idStructureMilo: 'id-structure-pas-ea'
  }
  const idPartenaireBeneficiaire = '123456'

  beforeEach(() => {
    const sandbox = createSandbox()
    suiviJobService = stubInterface(sandbox)
    dateService = stubClass(DateService)

    dateService.now.returns(maintenant)
    jeuneRepository = stubInterface(sandbox)
    rendezVousRepository = stubInterface(sandbox)
    sessionMiloRepository = stubInterface(sandbox)
    miloRendezVousRepository = stubInterface(sandbox)
    rendezVousMiloFactory = stubClass(RendezVousMilo.Factory)
    notificationService = stubClass(Notification.Service)
    planificateurService = stubClass(PlanificateurService)

    handler = new TraiterEvenementMiloJobHandler(
      suiviJobService,
      dateService,
      jeuneRepository,
      rendezVousRepository,
      sessionMiloRepository,
      miloRendezVousRepository,
      rendezVousMiloFactory,
      notificationService,
      planificateurService,
      testConfig()
    )
  })

  describe('handle', () => {
    describe('quand TYPE événement MILO non traitable', () => {
      it('ne fait rien', async () => {
        // Given
        const evenement = unEvenementMilo({
          idPartenaireBeneficiaire,
          objet: EvenementMilo.ObjetEvenement.RENDEZ_VOUS,
          action: EvenementMilo.ActionEvenement.NON_TRAITABLE
        })
        const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> = {
          dateExecution: uneDate(),
          type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
          contenu: evenement
        }

        // When
        const suiviJob = await handler.handle(job)

        // Then
        expect(rendezVousRepository.save).not.to.have.been.called()
        expect(suiviJob.resultat).to.be.deep.equal({
          traitement: Traitement.TYPE_EVENEMENT_NON_TRAITABLE,
          idJeune: undefined,
          idObjet: undefined
        })
      })
    })
    describe('quand OBJET événement MILO non traitable', () => {
      it('ne fait rien', async () => {
        // Given
        const evenement = unEvenementMilo({
          idPartenaireBeneficiaire,
          objet: EvenementMilo.ObjetEvenement.NON_TRAITABLE,
          action: EvenementMilo.ActionEvenement.CREATE
        })
        const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> = {
          dateExecution: uneDate(),
          type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
          contenu: evenement
        }

        // When
        const suiviJob = await handler.handle(job)

        // Then
        expect(rendezVousRepository.save).not.to.have.been.called()
        expect(suiviJob.resultat).to.be.deep.equal({
          traitement: Traitement.OBJET_EVENEMENT_NON_TRAITABLE,
          idJeune: undefined,
          idObjet: undefined
        })
      })
    })
    describe('quand JEUNE non existant', () => {
      it('ne fait rien', async () => {
        // Given
        const evenement = unEvenementMilo({
          idPartenaireBeneficiaire,
          objet: EvenementMilo.ObjetEvenement.RENDEZ_VOUS,
          action: EvenementMilo.ActionEvenement.CREATE
        })
        const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> = {
          dateExecution: uneDate(),
          type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
          contenu: evenement
        }
        jeuneRepository.getByIdDossier
          .withArgs(idPartenaireBeneficiaire)
          .resolves(failure(new NonTrouveError('Dossier Milo')))

        // When
        const result: SuiviJob = await handler.handle(job)

        // Then
        expect(result.resultat).to.be.deep.equal({
          traitement: Traitement.JEUNE_INEXISTANT,
          idJeune: undefined,
          idObjet: undefined
        })
        expect(rendezVousRepository.save).to.not.have.been.called()
      })
    })
    describe('quand ID objet vide', () => {
      it('ne fait rien', async () => {
        // Given
        const evenement = unEvenementMilo({
          idPartenaireBeneficiaire,
          objet: EvenementMilo.ObjetEvenement.RENDEZ_VOUS,
          action: EvenementMilo.ActionEvenement.CREATE,
          idObjet: null
        })
        const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> = {
          dateExecution: uneDate(),
          type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
          contenu: evenement
        }

        // When
        const result: SuiviJob = await handler.handle(job)

        // Then
        expect(result.resultat).to.be.deep.equal({
          traitement: Traitement.ID_OBJET_VIDE,
          idJeune: undefined,
          idObjet: undefined
        })
        expect(jeuneRepository.getByIdDossier).to.not.have.been.called()
        expect(rendezVousRepository.save).to.not.have.been.called()
      })
    })

    describe('quand traitable et JEUNE existant', () => {
      beforeEach(() => {
        jeuneRepository.getByIdDossier
          .withArgs(idPartenaireBeneficiaire)
          .resolves(success(jeune))
      })

      describe('quand RDV', () => {
        describe('quand traitement CREATE', () => {
          const evenement = unEvenementMilo({
            idPartenaireBeneficiaire,
            objet: EvenementMilo.ObjetEvenement.RENDEZ_VOUS,
            action: EvenementMilo.ActionEvenement.CREATE
          })
          const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> =
            {
              dateExecution: uneDate(),
              type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
              contenu: evenement
            }

          describe('quand RDV MILO inexistant', () => {
            it('ne fait rien', async () => {
              // Given
              miloRendezVousRepository.findRendezVousByEvenement
                .withArgs(evenement)
                .resolves(undefined)

              // When
              const result = await handler.handle(job)

              // Then
              expect(result.resultat).to.be.deep.equal({
                traitement: Traitement.TRAITEMENT_CREATE_INCONNU,
                idJeune: jeune.id,
                idObjet: undefined
              })
              expect(rendezVousRepository.save).to.not.have.been.called()
            })
          })
          describe('quand statut RDV MILO non recuperable', () => {
            it('ne fait rien', async () => {
              // Given
              const rendezVousMilo: RendezVousMilo = unRendezVousMilo({
                statut: 'Annulé'
              })
              miloRendezVousRepository.findRendezVousByEvenement
                .withArgs(evenement)
                .resolves(rendezVousMilo)

              // When
              const result = await handler.handle(job)

              // Then
              expect(result.resultat).to.be.deep.equal({
                traitement: Traitement.TRAITEMENT_CREATE_INCONNU,
                idJeune: jeune.id,
                idObjet: undefined
              })
              expect(rendezVousRepository.save).to.not.have.been.called()
            })
          })
          describe('quand date RDV MILO non recuperable', () => {
            it('ne fait rien', async () => {
              // Given
              const rendezVousMilo: RendezVousMilo = unRendezVousMilo({
                statut: 'Absent',
                dateHeureDebut: maintenant.minus({ year: 1, days: 1 }).toISO()
              })
              miloRendezVousRepository.findRendezVousByEvenement
                .withArgs(evenement)
                .resolves(rendezVousMilo)

              // When
              const result = await handler.handle(job)

              // Then
              expect(result.resultat).to.be.deep.equal({
                traitement: Traitement.TRAITEMENT_CREATE_INCONNU,
                idJeune: jeune.id,
                idObjet: undefined
              })
              expect(rendezVousRepository.save).to.not.have.been.called()
            })
          })
          describe('quand RDV MILO existant et statut recuperable', () => {
            it('crée sans notifier quand rdv passé', async () => {
              // Given
              const rendezVousMilo: RendezVousMilo = unRendezVousMilo({
                statut: 'Absent'
              })
              miloRendezVousRepository.findRendezVousByEvenement
                .withArgs(evenement)
                .resolves(rendezVousMilo)
              const rendezVous = unRendezVous({
                date: maintenant.minus({ days: 1 }).toJSDate()
              })
              rendezVousMiloFactory.createRendezVousCEJ
                .withArgs(rendezVousMilo, jeune)
                .returns(rendezVous)

              // When
              const result = await handler.handle(job)

              // Then
              expect(result.resultat).to.be.deep.equal({
                traitement: Traitement.RENDEZ_VOUS_AJOUTE,
                idJeune: jeune.id,
                idObjet: rendezVous.id
              })
              expect(
                rendezVousRepository.save
              ).to.have.been.calledOnceWithExactly(rendezVous)
              expect(
                planificateurService.planifierRappelsRendezVous
              ).to.have.been.calledOnceWithExactly(rendezVous)
              expect(
                notificationService.notifierLesJeunesDuRdv
              ).not.to.have.been.called()
            })
            it('crée sans notifier quand rdv futur mais statut non notifiable', async () => {
              // Given
              const rendezVousMilo: RendezVousMilo = unRendezVousMilo({
                statut: 'Réalisé'
              })
              miloRendezVousRepository.findRendezVousByEvenement
                .withArgs(evenement)
                .resolves(rendezVousMilo)
              const rendezVous = unRendezVous()
              rendezVousMiloFactory.createRendezVousCEJ
                .withArgs(rendezVousMilo, jeune)
                .returns(rendezVous)

              // When
              const result = await handler.handle(job)

              // Then
              expect(result.resultat).to.be.deep.equal({
                traitement: Traitement.RENDEZ_VOUS_AJOUTE,
                idJeune: jeune.id,
                idObjet: rendezVous.id
              })
              expect(
                rendezVousRepository.save
              ).to.have.been.calledOnceWithExactly(rendezVous)
              expect(
                planificateurService.planifierRappelsRendezVous
              ).to.have.been.calledOnceWithExactly(rendezVous)
              expect(
                notificationService.notifierLesJeunesDuRdv
              ).not.to.have.been.called()
            })
            it('crée et notifie quand rdv futur et statut notifiable', async () => {
              // Given
              const rendezVousMilo: RendezVousMilo = unRendezVousMilo({
                statut: 'Absent'
              })
              miloRendezVousRepository.findRendezVousByEvenement
                .withArgs(evenement)
                .resolves(rendezVousMilo)
              const rendezVous = unRendezVous()
              rendezVousMiloFactory.createRendezVousCEJ
                .withArgs(rendezVousMilo, jeune)
                .returns(rendezVous)

              // When
              const result = await handler.handle(job)

              // Then
              expect(result.resultat).to.be.deep.equal({
                traitement: Traitement.RENDEZ_VOUS_AJOUTE,
                idJeune: jeune.id,
                idObjet: rendezVous.id
              })
              expect(
                rendezVousRepository.save
              ).to.have.been.calledOnceWithExactly(rendezVous)
              expect(
                planificateurService.planifierRappelsRendezVous
              ).to.have.been.calledOnceWithExactly(rendezVous)
              expect(
                notificationService.notifierLesJeunesDuRdv
              ).to.have.been.calledOnceWithExactly(
                rendezVous,
                Notification.Type.NEW_RENDEZVOUS
              )
            })
          })
        })
        describe('quand traitement UPDATE', () => {
          const evenement = unEvenementMilo({
            idPartenaireBeneficiaire,
            objet: EvenementMilo.ObjetEvenement.RENDEZ_VOUS,
            action: EvenementMilo.ActionEvenement.UPDATE
          })
          const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> =
            {
              dateExecution: uneDate(),
              type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
              contenu: evenement
            }

          describe('quand RDV MILO inexistant', () => {
            it('ne fait rien', async () => {
              // Given
              miloRendezVousRepository.findRendezVousByEvenement
                .withArgs(evenement)
                .resolves(undefined)

              // When
              const result = await handler.handle(job)

              // Then
              expect(result.resultat).to.be.deep.equal({
                traitement: Traitement.TRAITEMENT_UPDATE_INCONNU,
                idJeune: jeune.id,
                idObjet: undefined
              })
              expect(rendezVousRepository.save).not.to.have.been.called()
            })
          })
          describe('quand RDV MILO existant', () => {
            describe('quand RDV CEJ inexistant', () => {
              it('crée le RDV CEJ', async () => {
                // Given
                const rendezVousMilo: RendezVousMilo = unRendezVousMilo({
                  statut: 'Absent'
                })
                miloRendezVousRepository.findRendezVousByEvenement
                  .withArgs(evenement)
                  .resolves(rendezVousMilo)
                const rendezVous = unRendezVous()
                rendezVousMiloFactory.createRendezVousCEJ
                  .withArgs(rendezVousMilo, jeune)
                  .returns(rendezVous)

                // When
                const result = await handler.handle(job)

                // Then
                expect(result.resultat).to.be.deep.equal({
                  traitement: Traitement.RENDEZ_VOUS_AJOUTE,
                  idJeune: jeune.id,
                  idObjet: rendezVous.id
                })
                expect(
                  rendezVousRepository.save
                ).to.have.been.calledOnceWithExactly(rendezVous)
                expect(
                  planificateurService.planifierRappelsRendezVous
                ).to.have.been.calledOnceWithExactly(rendezVous)
                expect(
                  notificationService.notifierLesJeunesDuRdv
                ).to.have.been.calledOnceWithExactly(
                  rendezVous,
                  Notification.Type.NEW_RENDEZVOUS
                )
              })
            })
            describe('quand RDV CEJ existant', () => {
              describe('quand statut non recuperable', () => {
                it('supprime le RDV CEJ sans notifier', async () => {
                  const rendezVous = unRendezVous()
                  rendezVousRepository.getByIdPartenaire
                    .withArgs(evenement.idObjet, evenement.objet)
                    .returns(rendezVous)

                  const rendezVousMilo: RendezVousMilo = unRendezVousMilo({
                    statut: 'Annulé'
                  })
                  miloRendezVousRepository.findRendezVousByEvenement
                    .withArgs(evenement)
                    .resolves(rendezVousMilo)

                  // When
                  const result = await handler.handle(job)

                  // Then
                  expect(result.resultat).to.be.deep.equal({
                    traitement: Traitement.RENDEZ_VOUS_SUPPRIME,
                    idJeune: jeune.id,
                    idObjet: rendezVous.id
                  })
                  expect(
                    rendezVousRepository.delete
                  ).to.have.been.calledOnceWithExactly(rendezVous.id)
                  expect(rendezVousRepository.save).not.to.have.been.called()
                  expect(
                    planificateurService.supprimerRappelsParId
                  ).to.have.been.calledOnceWithExactly(rendezVous.id)
                  expect(
                    notificationService.notifierLesJeunesDuRdv
                  ).not.to.have.been.called()
                })
              })
              describe('quand date non recuperable', () => {
                it('supprime le rdv CEJ et notifie', async () => {
                  const rendezVous = unRendezVous()
                  rendezVousRepository.getByIdPartenaire
                    .withArgs(evenement.idObjet, evenement.objet)
                    .returns(rendezVous)

                  const rendezVousMilo: RendezVousMilo = unRendezVousMilo({
                    statut: 'Absent',
                    dateHeureDebut: maintenant
                      .minus({ year: 1, days: 1 })
                      .toISO()
                  })
                  miloRendezVousRepository.findRendezVousByEvenement
                    .withArgs(evenement)
                    .resolves(rendezVousMilo)

                  // When
                  const result = await handler.handle(job)

                  // Then
                  expect(result.resultat).to.be.deep.equal({
                    traitement: Traitement.RENDEZ_VOUS_SUPPRIME,
                    idJeune: jeune.id,
                    idObjet: rendezVous.id
                  })
                  expect(
                    rendezVousRepository.delete
                  ).to.have.been.calledOnceWithExactly(rendezVous.id)
                  expect(rendezVousRepository.save).not.to.have.been.called()
                  expect(
                    planificateurService.supprimerRappelsParId
                  ).to.have.been.calledOnceWithExactly(rendezVous.id)
                  expect(
                    notificationService.notifierLesJeunesDuRdv
                  ).to.have.been.calledOnceWithExactly(
                    rendezVous,
                    Notification.Type.DELETED_RENDEZVOUS
                  )
                })
              })
              describe('quand statut recuperable', () => {
                it('met à jour le rdv CEJ, replanifie et notifie', async () => {
                  const rendezVousMilo: RendezVousMilo = unRendezVousMilo({
                    statut: 'Absent'
                  })
                  miloRendezVousRepository.findRendezVousByEvenement
                    .withArgs(evenement)
                    .resolves(rendezVousMilo)
                  const rendezVous = unRendezVous()
                  rendezVousRepository.getByIdPartenaire
                    .withArgs(evenement.idObjet, evenement.objet)
                    .returns(rendezVous)

                  const rendezVousUpdated = unRendezVous({
                    titre: 'hi',
                    date: maintenant.plus({ days: 4 }).toJSDate()
                  })
                  rendezVousMiloFactory.updateRendezVousCEJ
                    .withArgs(rendezVous, rendezVousMilo)
                    .returns(rendezVousUpdated)

                  // When
                  const result = await handler.handle(job)

                  // Then
                  expect(result.resultat).to.be.deep.equal({
                    traitement: Traitement.RENDEZ_VOUS_MODIFIE,
                    idJeune: jeune.id,
                    idObjet: rendezVous.id
                  })
                  expect(
                    rendezVousRepository.save
                  ).to.have.been.calledOnceWithExactly(rendezVousUpdated)
                  expect(
                    planificateurService.supprimerRappelsParId
                  ).to.have.been.calledOnceWithExactly(rendezVousUpdated.id)
                  expect(
                    planificateurService.planifierRappelsRendezVous
                  ).to.have.been.calledOnceWithExactly(rendezVousUpdated)
                  expect(
                    notificationService.notifierLesJeunesDuRdv
                  ).to.have.been.calledOnceWithExactly(
                    rendezVousUpdated,
                    Notification.Type.UPDATED_RENDEZVOUS
                  )
                })
              })
            })
          })
        })
        describe('quand traitement DELETE', () => {
          const evenement = unEvenementMilo({
            idPartenaireBeneficiaire,
            objet: EvenementMilo.ObjetEvenement.RENDEZ_VOUS,
            action: EvenementMilo.ActionEvenement.DELETE
          })
          const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> =
            {
              dateExecution: uneDate(),
              type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
              contenu: evenement
            }

          describe('quand rdv CEJ inexistant', () => {
            it('ne fait rien', async () => {
              // Given
              miloRendezVousRepository.findRendezVousByEvenement
                .withArgs(evenement)
                .resolves(undefined)

              // When
              const result = await handler.handle(job)

              // Then
              expect(result.resultat).to.be.deep.equal({
                traitement: Traitement.TRAITEMENT_DELETE_INCONNU,
                idJeune: jeune.id,
                idObjet: undefined
              })
              expect(rendezVousRepository.save).to.not.have.been.called()
            })
          })
          describe('quand rdv CEJ existant', () => {
            it('supprime le rdv CEJ et notifie', async () => {
              const rendezVous = unRendezVous()
              rendezVousRepository.getByIdPartenaire
                .withArgs(evenement.idObjet, evenement.objet)
                .returns(rendezVous)

              const rendezVousMilo: RendezVousMilo = unRendezVousMilo({
                statut: 'Absent'
              })
              miloRendezVousRepository.findRendezVousByEvenement
                .withArgs(evenement)
                .resolves(rendezVousMilo)

              // When
              const result = await handler.handle(job)

              // Then
              expect(result.resultat).to.be.deep.equal({
                traitement: Traitement.RENDEZ_VOUS_SUPPRIME,
                idJeune: jeune.id,
                idObjet: rendezVous.id
              })
              expect(
                rendezVousRepository.delete
              ).to.have.been.calledOnceWithExactly(rendezVous.id)
              expect(
                planificateurService.supprimerRappelsParId
              ).to.have.been.calledOnceWithExactly(rendezVous.id)
              expect(
                notificationService.notifierLesJeunesDuRdv
              ).to.have.been.calledOnceWithExactly(
                rendezVous,
                Notification.Type.DELETED_RENDEZVOUS
              )
            })
            it('supprime le rdv CEJ sans notifier quand rdv MILO inexistant', async () => {
              const rendezVous = unRendezVous({
                type: CodeTypeRendezVous.RENDEZ_VOUS_MILO
              })
              rendezVousRepository.getByIdPartenaire
                .withArgs(evenement.idObjet, evenement.objet)
                .returns(rendezVous)

              miloRendezVousRepository.findRendezVousByEvenement
                .withArgs(evenement)
                .resolves(undefined)

              // When
              const result = await handler.handle(job)

              // Then
              expect(result.resultat).to.be.deep.equal({
                traitement: Traitement.RENDEZ_VOUS_SUPPRIME,
                idJeune: jeune.id,
                idObjet: rendezVous.id
              })
              expect(
                rendezVousRepository.delete
              ).to.have.been.calledOnceWithExactly(rendezVous.id)
              expect(
                planificateurService.supprimerRappelsParId
              ).to.have.been.calledOnceWithExactly(rendezVous.id)
              expect(
                notificationService.notifierLesJeunesDuRdv
              ).not.to.have.been.called()
            })
          })
        })
      })
      describe('quand INSTANCE SESSION', () => {
        describe('quand traitement CREATE', () => {
          const evenement = unEvenementMilo({
            idPartenaireBeneficiaire,
            objet: EvenementMilo.ObjetEvenement.SESSION,
            action: EvenementMilo.ActionEvenement.CREATE
          })
          const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> =
            {
              dateExecution: uneDate(),
              type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
              contenu: evenement
            }

          describe('quand Session MILO existante et statut recuperable', () => {
            it('notifie et planifie rappel sans créer quand date futur et statut notifiable', async () => {
              // Given
              const instance = uneInstanceSessionMilo({
                statut: 'Prescrit'
              })
              sessionMiloRepository.findInstanceSession
                .withArgs(evenement.idObjet, evenement.idPartenaireBeneficiaire)
                .resolves(instance)

              // When
              const result = await handler.handle(job)

              // Then
              expect(result.resultat).to.be.deep.equal({
                traitement: Traitement.NOTIFICATION_INSTANCE_SESSION_AJOUT,
                idJeune: jeune.id,
                idObjet: instance.id
              })
              expect(rendezVousRepository.save).not.to.have.been.called()
              expect(
                planificateurService.planifierRappelsRendezVous
              ).not.to.have.been.called()
              expect(
                notificationService.notifierInscriptionSession
              ).to.have.been.calledOnceWithExactly(instance.idSession, [jeune])
              expect(
                planificateurService.planifierRappelsInstanceSessionMilo
              ).to.have.been.calledOnceWithExactly({
                idInstance: instance.id,
                idDossier: instance.idDossier,
                idSession: instance.idSession,
                dateDebut: RendezVousMilo.timezonerDateMilo(
                  instance.dateHeureDebut,
                  jeune
                )
              })
            })
          })
        })
        describe('quand traitement UPDATE', () => {
          const evenement = unEvenementMilo({
            idPartenaireBeneficiaire,
            objet: EvenementMilo.ObjetEvenement.SESSION,
            action: EvenementMilo.ActionEvenement.UPDATE
          })
          const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> =
            {
              dateExecution: uneDate(),
              type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
              contenu: evenement
            }
          it('notification modification quand le statut est récupérable et replanifie rappels', async () => {
            const instance = uneInstanceSessionMilo({
              statut: 'Prescrit'
            })
            sessionMiloRepository.findInstanceSession
              .withArgs(evenement.idObjet, evenement.idPartenaireBeneficiaire)
              .resolves(instance)

            // When
            const result = await handler.handle(job)

            // Then
            expect(result.resultat).to.be.deep.equal({
              traitement: Traitement.NOTIFICATION_INSTANCE_SESSION_MODIFICATION,
              idJeune: jeune.id,
              idObjet: instance.id
            })
            expect(
              notificationService.notifierModificationSession
            ).to.have.been.calledOnceWithExactly(instance.idSession, [jeune])
            expect(
              planificateurService.supprimerRappelsParId
            ).to.have.been.calledOnceWithExactly('instance-session:34')
            expect(
              planificateurService.planifierRappelsInstanceSessionMilo
            ).to.have.been.calledOnceWithExactly({
              idInstance: instance.id,
              idDossier: instance.idDossier,
              idSession: instance.idSession,
              dateDebut: RendezVousMilo.timezonerDateMilo(
                instance.dateHeureDebut,
                jeune
              )
            })
          })
          it('notification suppression quand le statut est non récupérable et supprime les rappels', async () => {
            const instance = uneInstanceSessionMilo({
              statut: 'Refus jeune'
            })
            sessionMiloRepository.findInstanceSession
              .withArgs(evenement.idObjet, evenement.idPartenaireBeneficiaire)
              .resolves(instance)

            // When
            const result = await handler.handle(job)

            // Then
            expect(result.resultat).to.be.deep.equal({
              traitement: Traitement.NOTIFICATION_INSTANCE_SESSION_SUPPRESSION,
              idJeune: jeune.id,
              idObjet: instance.id
            })
            expect(
              planificateurService.supprimerRappelsParId
            ).to.have.been.calledOnceWithExactly('instance-session:34')
            expect(
              notificationService.notifierDesinscriptionSession
            ).to.have.been.calledOnceWithExactly(
              instance.idSession,
              RendezVousMilo.timezonerDateMilo(instance.dateHeureDebut, jeune),
              [jeune]
            )
          })
        })
        describe('quand traitement DELETE', () => {
          const evenement = unEvenementMilo({
            idPartenaireBeneficiaire,
            objet: EvenementMilo.ObjetEvenement.SESSION,
            action: EvenementMilo.ActionEvenement.DELETE
          })
          const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> =
            {
              dateExecution: uneDate(),
              type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
              contenu: evenement
            }
          it('supprime les rappels', async () => {
            sessionMiloRepository.findInstanceSession.resolves(undefined)

            // When
            await handler.handle(job)

            // Then
            expect(
              planificateurService.supprimerRappelsParId
            ).to.have.been.calledOnceWithExactly('instance-session:34')
          })
          it('notifie quand Session MILO existante', async () => {
            const sessionMilo = uneInstanceSessionMilo({
              statut: 'Absent'
            })
            sessionMiloRepository.findInstanceSession
              .withArgs(evenement.idObjet, evenement.idPartenaireBeneficiaire)
              .resolves(sessionMilo)

            // When
            const result = await handler.handle(job)

            // Then
            expect(result.resultat).to.be.deep.equal({
              traitement: Traitement.NOTIFICATION_INSTANCE_SESSION_SUPPRESSION,
              idJeune: jeune.id,
              idObjet: sessionMilo.id
            })
            expect(rendezVousRepository.delete).not.to.have.been.called()
            expect(
              notificationService.notifierDesinscriptionSession
            ).to.have.been.calledOnceWithExactly(
              sessionMilo.idSession,
              RendezVousMilo.timezonerDateMilo(
                sessionMilo.dateHeureDebut,
                jeune
              ),
              [jeune]
            )
          })
        })
      })
    })
  })
})
