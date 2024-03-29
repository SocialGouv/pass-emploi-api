import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox, createSandbox } from 'sinon'
import { StubbedClass, expect, stubClass } from 'test/utils'
import { SuivreEvenementsMiloCronJobHandler } from '../../../src/application/jobs/suivre-file-evenements-milo.job.handler'
import { EvenementMilo } from '../../../src/domain/milo/evenement.milo'
import {
  Planificateur,
  PlanificateurService
} from '../../../src/domain/planificateur'
import { SuiviJob } from '../../../src/domain/suivi-job'
import { DateService } from '../../../src/utils/date-service'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unEvenementMilo } from '../../fixtures/milo.fixture'

describe('SuivreEvenementsMiloCronJobHandler', () => {
  let suivreEvenementsMiloHandler: SuivreEvenementsMiloCronJobHandler
  let evenementMiloRepository: StubbedType<EvenementMilo.Repository>
  let suiviJobService: StubbedType<SuiviJob.Service>
  let dateService: StubbedClass<DateService>
  let planificateurService: StubbedClass<PlanificateurService>
  let planificateurRepository: StubbedType<Planificateur.Repository>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    evenementMiloRepository = stubInterface(sandbox)
    suiviJobService = stubInterface(sandbox)
    dateService = stubClass(DateService)
    dateService.now.returns(uneDatetime())
    planificateurService = stubClass(PlanificateurService)
    planificateurRepository = stubInterface(sandbox)

    suivreEvenementsMiloHandler = new SuivreEvenementsMiloCronJobHandler(
      suiviJobService,
      evenementMiloRepository,
      dateService,
      planificateurService,
      planificateurRepository
    )
  })
  describe('quand un job est déjà en cours', () => {
    it('il ne doit pas récupérer les évènements milo', async () => {
      // Given
      planificateurRepository.estEnCours.resolves(true)

      // When
      await suivreEvenementsMiloHandler.handle()

      // Then
      expect(
        evenementMiloRepository.findAllEvenements
      ).to.not.have.been.called()
    })
  })
  describe('quand le job n‘est pas en cours', () => {
    beforeEach(() => {
      // Given
      planificateurRepository.estEnCours.resolves(false)
    })

    describe('quand il y a au moins un évènement milo', () => {
      let eventMilo1: EvenementMilo
      let eventMilo2: EvenementMilo

      beforeEach(() => {
        // Given
        eventMilo1 = unEvenementMilo({ id: 'un-evenement' })
        eventMilo2 = unEvenementMilo({ id: 'un-autre-evenement' })
        evenementMiloRepository.findAllEvenements
          .onFirstCall()
          .resolves([eventMilo1, eventMilo2])
          .onSecondCall()
          .resolves([])
      })
      it('crée un job sur redis pour chaque evenement', async () => {
        // When
        await suivreEvenementsMiloHandler.handle()

        // Then
        expect(
          planificateurService.creerJobEvenementMiloSiIlNaPasEteCreeAvant
        ).to.have.been.calledWith(eventMilo1)
        expect(
          planificateurService.creerJobEvenementMiloSiIlNaPasEteCreeAvant
        ).to.have.been.calledWith(eventMilo2)
      })
      it('acquitte chaque évènement', async () => {
        // When
        await suivreEvenementsMiloHandler.handle()

        // Then
        expect(
          evenementMiloRepository.acquitterEvenement
        ).to.have.been.calledWith(eventMilo1)
        expect(
          evenementMiloRepository.acquitterEvenement
        ).to.have.been.calledWith(eventMilo2)
      })

      it("s'arrête quand milo ne retourne plus d'évènement", async () => {
        // Given
        evenementMiloRepository.findAllEvenements
          .onFirstCall()
          .resolves([eventMilo1])
          .onSecondCall()
          .resolves([eventMilo2])
          .onThirdCall()
          .resolves([])

        // When
        await suivreEvenementsMiloHandler.handle()

        // Then
        expect(evenementMiloRepository.findAllEvenements).to.have.callCount(3)
        expect(
          planificateurService.creerJobEvenementMiloSiIlNaPasEteCreeAvant
        ).to.have.been.calledWith(eventMilo1)
        expect(
          planificateurService.creerJobEvenementMiloSiIlNaPasEteCreeAvant
        ).to.have.been.calledWith(eventMilo2)
        expect(
          evenementMiloRepository.acquitterEvenement
        ).to.have.been.calledWith(eventMilo1)
        expect(
          evenementMiloRepository.acquitterEvenement
        ).to.have.been.calledWith(eventMilo2)
      })
    })
  })
})
