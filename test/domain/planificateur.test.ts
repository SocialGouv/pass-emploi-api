import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import {
  Planificateur,
  PlanificateurService
} from '../../src/domain/planificateur'
import { RendezVous } from '../../src/domain/rendez-vous'
import { DateService } from '../../src/utils/date-service'
import { unRendezVous } from '../fixtures/rendez-vous.fixture'
import { createSandbox, expect, stubClass } from '../utils'

describe('Planificateur', () => {
  describe('Service', () => {
    const today = DateTime.fromISO('2020-04-06T12:00:00.000Z').toUTC()
    let planificateurService: PlanificateurService
    let planificateurRepository: StubbedType<Planificateur.Repository>
    let dateService: StubbedType<DateService>

    beforeEach(() => {
      const sandbox = createSandbox()
      planificateurRepository = stubInterface(sandbox)
      dateService = stubClass(DateService)
      dateService.now.returns(today)
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
            date: today.plus({ day: 1 }).toJSDate()
          }

          // When
          await planificateurService.planifierRappelsRendezVous(rendezVous)

          // Then
          expect(planificateurRepository.createJob).to.have.callCount(0)
        })
      })
      describe('quand le rendez vous est à moins de 7 jours et à plus de 1 jour', () => {
        it('génère un job pour un rappel un jour avant le rendez vous', async () => {
          // Given
          const rendezVous: RendezVous = {
            ...unRendezVous(),
            date: today.plus({ day: 5 }).toJSDate()
          }

          // When
          await planificateurService.planifierRappelsRendezVous(rendezVous)

          // Then
          expect(planificateurRepository.createJob).to.have.callCount(1)
          expect(planificateurRepository.createJob).to.have.been.calledWith(
            {
              date: DateTime.fromJSDate(rendezVous.date)
                .minus({ days: 1 })
                .toJSDate(),
              type: Planificateur.JobEnum.RENDEZVOUS,
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
            date: today.plus({ day: 8 }).toJSDate()
          }

          // When
          await planificateurService.planifierRappelsRendezVous(rendezVous)
        })

        it('génère un job pour un rappel un jour avant le rendez vous', async () => {
          // Then
          expect(planificateurRepository.createJob).to.have.been.calledWith(
            {
              date: DateTime.fromJSDate(rendezVous.date)
                .minus({ days: 1 })
                .toJSDate(),
              type: Planificateur.JobEnum.RENDEZVOUS,
              contenu: { idRendezVous: rendezVous.id }
            },
            `rdv:${rendezVous.id}:1`
          )
        })

        it('génère un job pour un rappel sept jours avant le rendez vous', async () => {
          // Then
          expect(planificateurRepository.createJob).to.have.callCount(2)
          expect(planificateurRepository.createJob).to.have.been.calledWith(
            {
              date: DateTime.fromJSDate(rendezVous.date)
                .minus({ days: 7 })
                .toJSDate(),
              type: Planificateur.JobEnum.RENDEZVOUS,
              contenu: { idRendezVous: rendezVous.id }
            },
            `rdv:${rendezVous.id}:7`
          )
        })
      })
    })
  })
})
