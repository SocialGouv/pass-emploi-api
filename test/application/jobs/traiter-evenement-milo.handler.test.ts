import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import {
  TraiterEvenementMiloJobHandler,
  Traitement
} from '../../../src/application/jobs/traiter-evenement-milo.handler'
import { Jeune } from '../../../src/domain/jeune/jeune'
import {
  Planificateur,
  PlanificateurService
} from '../../../src/domain/planificateur'
import { RendezVous } from '../../../src/domain/rendez-vous/rendez-vous'
import { SuiviJob } from '../../../src/domain/suivi-job'
import { DateService } from '../../../src/utils/date-service'
import { uneDate, uneDatetime } from '../../fixtures/date.fixture'
import {
  unEvenementMilo,
  unRendezVousMilo
} from '../../fixtures/partenaire.fixture'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'
import { unJeune } from '../../fixtures/jeune.fixture'
import { RendezVousMilo } from '../../../src/domain/rendez-vous/rendez-vous.milo'
import { Notification } from '../../../src/domain/notification/notification'
import { testConfig } from '../../utils/module-for-testing'

describe('TraiterEvenementMiloJobHandler', () => {
  let handler: TraiterEvenementMiloJobHandler
  let suiviJobService: StubbedType<SuiviJob.Service>
  let dateService: StubbedClass<DateService>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let miloRendezVousRepository: StubbedType<RendezVousMilo.Repository>
  let rendezVousMiloFactory: StubbedClass<RendezVousMilo.Factory>
  let notificationService: StubbedClass<Notification.Service>
  let planificateurService: StubbedClass<PlanificateurService>

  const maintenant = uneDatetime()
  const jeune: Jeune = unJeune()
  const idPartenaireBeneficiaire = '123456'

  beforeEach(() => {
    const sandbox = createSandbox()
    suiviJobService = stubInterface(sandbox)
    dateService = stubClass(DateService)

    dateService.now.returns(maintenant)
    jeuneRepository = stubInterface(sandbox)
    rendezVousRepository = stubInterface(sandbox)
    miloRendezVousRepository = stubInterface(sandbox)
    rendezVousMiloFactory = stubClass(RendezVousMilo.Factory)
    notificationService = stubClass(Notification.Service)
    planificateurService = stubClass(PlanificateurService)

    handler = new TraiterEvenementMiloJobHandler(
      suiviJobService,
      dateService,
      jeuneRepository,
      rendezVousRepository,
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
          objet: RendezVousMilo.ObjetEvenement.RENDEZ_VOUS,
          type: RendezVousMilo.TypeEvenement.NON_TRAITABLE
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
          traitement: Traitement.TYPE_NON_TRAITABLE,
          idJeune: undefined,
          idRendezVous: undefined
        })
      })
    })
    describe('quand OBJET événement MILO non traitable', () => {
      it('ne fait rien', async () => {
        // Given
        const evenement = unEvenementMilo({
          idPartenaireBeneficiaire,
          objet: RendezVousMilo.ObjetEvenement.NON_TRAITABLE,
          type: RendezVousMilo.TypeEvenement.CREATE
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
          traitement: Traitement.OBJET_NON_TRAITABLE,
          idJeune: undefined,
          idRendezVous: undefined
        })
      })
    })
    describe('quand JEUNE non existant', () => {
      it('ne fait rien', async () => {
        // Given
        const evenement = unEvenementMilo({
          idPartenaireBeneficiaire,
          objet: RendezVousMilo.ObjetEvenement.RENDEZ_VOUS,
          type: RendezVousMilo.TypeEvenement.CREATE
        })
        const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> = {
          dateExecution: uneDate(),
          type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
          contenu: evenement
        }
        jeuneRepository.getByIdPartenaire
          .withArgs(idPartenaireBeneficiaire)
          .resolves(undefined)

        // When
        const result: SuiviJob = await handler.handle(job)

        // Then
        expect(result.resultat).to.be.deep.equal({
          traitement: Traitement.JEUNE_INEXISTANT,
          idJeune: undefined,
          idRendezVous: undefined
        })
        expect(rendezVousRepository.save).to.not.have.been.called()
      })
    })

    describe('quand traitable et JEUNE existant', () => {
      beforeEach(() => {
        jeuneRepository.getByIdPartenaire
          .withArgs(idPartenaireBeneficiaire)
          .resolves(jeune)
      })

      describe('quand traitement CREATE', () => {
        const evenement = unEvenementMilo({
          idPartenaireBeneficiaire,
          objet: RendezVousMilo.ObjetEvenement.RENDEZ_VOUS,
          type: RendezVousMilo.TypeEvenement.CREATE
        })
        const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> = {
          dateExecution: uneDate(),
          type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
          contenu: evenement
        }

        describe('quand rdv MILO inexistant', () => {
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
              idRendezVous: undefined
            })
            expect(rendezVousRepository.save).to.not.have.been.called()
          })
        })
        describe('quand statut rdv MILO non recuperable', () => {
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
              idRendezVous: undefined
            })
            expect(rendezVousRepository.save).to.not.have.been.called()
          })
        })
        describe('quand rdv MILO existant et statut recuperable', () => {
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
              idRendezVous: rendezVous.id
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
              idRendezVous: rendezVous.id
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
              idRendezVous: rendezVous.id
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
          objet: RendezVousMilo.ObjetEvenement.RENDEZ_VOUS,
          type: RendezVousMilo.TypeEvenement.UPDATE
        })
        const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> = {
          dateExecution: uneDate(),
          type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
          contenu: evenement
        }

        describe('quand rdv MILO inexistant', () => {
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
              idRendezVous: undefined
            })
            expect(rendezVousRepository.save).not.to.have.been.called()
          })
        })
        describe('quand rdv MILO existant', () => {
          describe('quand rdv CEJ inexistant', () => {
            it('crée le rdv CEJ', async () => {
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
                idRendezVous: rendezVous.id
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
          describe('quand rdv CEJ existant', () => {
            describe('quand statut non recuperable', () => {
              it('supprime le rdv CEJ sans notifier', async () => {
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
                  idRendezVous: rendezVous.id
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
                  idRendezVous: rendezVous.id
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
          objet: RendezVousMilo.ObjetEvenement.RENDEZ_VOUS,
          type: RendezVousMilo.TypeEvenement.DELETE
        })
        const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> = {
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
              idRendezVous: undefined
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
              idRendezVous: rendezVous.id
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
            const rendezVous = unRendezVous()
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
              idRendezVous: rendezVous.id
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
  })
})
