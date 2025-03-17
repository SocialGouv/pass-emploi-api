import { Logger } from '@nestjs/common'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import {
  InstanceSessionRappel,
  Planificateur,
  PlanificateurService
} from '../../src/domain/planificateur'
import { RendezVous } from '../../src/domain/rendez-vous/rendez-vous'
import { DateService } from '../../src/utils/date-service'
import { uneAction } from '../fixtures/action.fixture'
import { unEvenementMilo } from '../fixtures/milo.fixture'
import { unRendezVous } from '../fixtures/rendez-vous.fixture'
import { createSandbox, expect, stubClass, sinon } from '../utils'
import JobType = Planificateur.JobType

describe('Planificateur', () => {
  describe('Service', () => {
    const maintenant = DateTime.fromISO('2020-04-06T12:00:00.000Z')
    let planificateurService: PlanificateurService
    let planificateurRepository: StubbedType<Planificateur.Repository>
    let dateService: StubbedType<DateService>
    let sandbox: sinon.SinonSandbox

    beforeEach(() => {
      sandbox = createSandbox()
      planificateurRepository = stubInterface(sandbox)
      dateService = stubClass(DateService)
      dateService.now.returns(maintenant)
      dateService.nowJs.returns(maintenant.toJSDate())
      planificateurService = new PlanificateurService(
        planificateurRepository,
        dateService
      )
    })

    describe('planifierRappelsRendezVous', () => {
      describe('quand le rendez vous est dans 1 jour', () => {
        it('ne génère pas de job', async () => {
          // Given
          const rendezVous: RendezVous = {
            ...unRendezVous(),
            date: maintenant.plus({ day: 1 }).toJSDate()
          }

          // When
          await planificateurService.planifierRappelsRendezVous(rendezVous)

          // Then
          expect(planificateurRepository.ajouterJob).to.have.callCount(0)
        })
      })
      describe('quand le rendez vous est à moins de 7 jours et à plus de 1 jour', () => {
        it('génère un job pour un rappel un jour avant le rendez vous', async () => {
          // Given
          const rendezVous: RendezVous = {
            ...unRendezVous(),
            date: maintenant.plus({ day: 5 }).toJSDate()
          }

          // When
          await planificateurService.planifierRappelsRendezVous(rendezVous)

          // Then
          expect(planificateurRepository.ajouterJob).to.have.callCount(1)
          expect(planificateurRepository.ajouterJob).to.have.been.calledWith(
            {
              dateExecution: DateTime.fromJSDate(rendezVous.date)
                .minus({ days: 1 })
                .toJSDate(),
              type: Planificateur.JobType.RENDEZVOUS,
              contenu: { idRendezVous: rendezVous.id }
            },
            `rdv:${rendezVous.id}:1`
          )
        })
      })
      describe('quand le rendez vous est à plus de 7 jours', () => {
        let rendezVous: RendezVous

        beforeEach(async () => {
          // Given
          rendezVous = {
            ...unRendezVous(),
            date: maintenant.plus({ day: 8 }).toJSDate()
          }

          // When
          await planificateurService.planifierRappelsRendezVous(rendezVous)
        })

        it('génère un job pour un rappel un jour avant le rendez vous', async () => {
          // Then
          expect(planificateurRepository.ajouterJob).to.have.been.calledWith(
            {
              dateExecution: DateTime.fromJSDate(rendezVous.date)
                .minus({ days: 1 })
                .toJSDate(),
              type: Planificateur.JobType.RENDEZVOUS,
              contenu: { idRendezVous: rendezVous.id }
            },
            `rdv:${rendezVous.id}:1`
          )
        })

        it('génère un job pour un rappel sept jours avant le rendez vous', async () => {
          // Then
          expect(planificateurRepository.ajouterJob).to.have.callCount(2)
          expect(planificateurRepository.ajouterJob).to.have.been.calledWith(
            {
              dateExecution: DateTime.fromJSDate(rendezVous.date)
                .minus({ days: 7 })
                .toJSDate(),
              type: Planificateur.JobType.RENDEZVOUS,
              contenu: { idRendezVous: rendezVous.id }
            },
            `rdv:${rendezVous.id}:7`
          )
        })
      })
    })

    describe('planifierRappelsInstanceSessionMilo', () => {
      const rappel: InstanceSessionRappel = {
        idInstance: 'idInstance',
        idDossier: 'idDossier',
        idSession: 'idSession',
        dateDebut: maintenant
      }
      describe('quand la session Milo est dans 1 jour', () => {
        it('ne génère pas de job', async () => {
          // Given
          rappel.dateDebut = maintenant.plus({ days: 1 })

          // When
          await planificateurService.planifierRappelsInstanceSessionMilo(rappel)

          // Then
          expect(planificateurRepository.ajouterJob).to.have.callCount(0)
        })
      })
      describe('quand la session Milo est à moins de 7 jours et à plus de 1 jour', () => {
        it('génère un job pour un rappel un jour avant la session Milo', async () => {
          // Given
          rappel.dateDebut = maintenant.plus({ day: 5 })

          // When
          await planificateurService.planifierRappelsInstanceSessionMilo(rappel)

          // Then
          expect(
            planificateurRepository.ajouterJob
          ).to.have.been.calledOnceWithExactly(
            {
              dateExecution: rappel.dateDebut.minus({ days: 1 }).toJSDate(),
              type: Planificateur.JobType.RAPPEL_SESSION,
              contenu: rappel
            },
            `instance-session:${rappel.idInstance}:1`
          )
        })
      })
      describe('quand la session Milo est à plus de 7 jours', () => {
        beforeEach(async () => {
          // Given
          rappel.dateDebut = maintenant.plus({ day: 8 })
          // When
          await planificateurService.planifierRappelsInstanceSessionMilo(rappel)
        })

        it('génère un job pour un rappel un jour avant la session Milo', async () => {
          // Then
          expect(planificateurRepository.ajouterJob).to.have.been.calledWith(
            {
              dateExecution: rappel.dateDebut.minus({ days: 1 }).toJSDate(),
              type: Planificateur.JobType.RAPPEL_SESSION,
              contenu: rappel
            },
            `instance-session:${rappel.idInstance}:1`
          )
        })

        it('génère un job pour un rappel sept jours avant la session Milo', async () => {
          // Then
          expect(planificateurRepository.ajouterJob).to.have.callCount(2)
          expect(
            planificateurRepository.ajouterJob
          ).to.have.been.calledWithExactly(
            {
              dateExecution: rappel.dateDebut.minus({ days: 7 }).toJSDate(),
              type: Planificateur.JobType.RAPPEL_SESSION,
              contenu: rappel
            },
            `instance-session:${rappel.idInstance}:7`
          )
        })
      })
    })

    describe('planifierRappelAction', () => {
      it('génère un job pour un rappel sept jours avant le rendez vous', async () => {
        // Given
        const action = uneAction()

        // When
        await planificateurService.planifierRappelAction(action)

        // Then
        const job: Planificateur.Job<Planificateur.JobRappelAction> = {
          dateExecution: action.dateEcheance.minus({ days: 3 }).toJSDate(),
          type: Planificateur.JobType.RAPPEL_ACTION,
          contenu: { idAction: action.id }
        }
        expect(
          planificateurRepository.ajouterJob
        ).to.have.been.calledWithExactly(
          job,
          'action:721e2108-60f5-4a75-b102-04fe6a40e899:3'
        )
      })
    })

    describe('ajouterJobEvenementMilo', () => {
      it('planifie un job maintenant', async () => {
        // GIVEN
        const monEvenementMilo = unEvenementMilo()
        // WHEN
        await planificateurService.ajouterJobEvenementMiloSiIlNaPasEteCreeAvant(
          monEvenementMilo
        )
        // THEN
        const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> = {
          type: JobType.TRAITER_EVENEMENT_MILO,
          contenu: monEvenementMilo,
          dateExecution: maintenant.toJSDate()
        }
        expect(planificateurRepository.ajouterJob).to.have.been.calledWith(
          job,
          `event-milo:${monEvenementMilo.id}`
        )
      })
    })

    describe('ajouterJobClotureSessions', () => {
      it('planifie un job maintenant', async () => {
        // Given
        const dateCloture = maintenant.minus({ days: 2 })

        // When
        await planificateurService.ajouterJobClotureSessions(
          ['id-session-1', 'id-session-2'],
          'id-structure-milo',
          dateCloture,
          new Logger('test-PlanificateurService')
        )

        // Then
        expect(
          planificateurRepository.ajouterJob
        ).to.have.been.calledOnceWithExactly({
          dateExecution: maintenant.toJSDate(),
          type: 'CLORE_SESSIONS',
          contenu: {
            dateCloture: dateCloture.toJSDate(),
            idsSessions: ['id-session-1', 'id-session-2'],
            idStructureMilo: 'id-structure-milo'
          }
        })
      })
    })
  })
})
