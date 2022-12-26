import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox, createSandbox } from 'sinon'
import { StubbedClass, expect, stubClass } from 'test/utils'
import { HandleJobSuivreEvenementsMiloHandler } from '../../../../src/application/commands/jobs/handle-job-suivre-evenements-milo.handler'
import { Partenaire } from '../../../../src/domain/partenaire/partenaire'
import {
  Planificateur,
  PlanificateurService
} from '../../../../src/domain/planificateur'
import { SuiviJob } from '../../../../src/domain/suivi-job'
import { DateService } from '../../../../src/utils/date-service'
import { unEvenementMilo } from '../../../fixtures/partenaire.fixture'
import { uneDatetime } from '../../../fixtures/date.fixture'

describe('HandleJobSuivreEvenementsMiloHandler', () => {
  let handleJobSuivreEvenementsMiloHandler: HandleJobSuivreEvenementsMiloHandler
  let partenaireMiloRepository: StubbedType<Partenaire.Milo.Repository>
  let suiviJobService: StubbedType<SuiviJob.Service>
  let dateService: StubbedClass<DateService>
  let planificateurService: StubbedClass<PlanificateurService>
  let planificateurRepository: StubbedType<Planificateur.Repository>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    partenaireMiloRepository = stubInterface(sandbox)
    suiviJobService = stubInterface(sandbox)
    dateService = stubClass(DateService)
    dateService.now.returns(uneDatetime())
    planificateurService = stubClass(PlanificateurService)
    planificateurRepository = stubInterface(sandbox)

    handleJobSuivreEvenementsMiloHandler =
      new HandleJobSuivreEvenementsMiloHandler(
        suiviJobService,
        partenaireMiloRepository,
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
      await handleJobSuivreEvenementsMiloHandler.handle()

      // Then
      expect(
        partenaireMiloRepository.findAllEvenements
      ).to.not.have.been.called()
    })
  })
  describe('quand le job n‘est pas en cours', () => {
    beforeEach(() => {
      // Given
      planificateurRepository.estEnCours.resolves(false)
    })

    describe('quand il y a au moins un évènement milo', () => {
      let eventMilo1: Partenaire.Milo.Evenement
      let eventMilo2: Partenaire.Milo.Evenement

      beforeEach(() => {
        // Given
        eventMilo1 = unEvenementMilo({ id: 'un-evenement' })
        eventMilo2 = unEvenementMilo({ id: 'un-autre-evenement' })
        partenaireMiloRepository.findAllEvenements
          .onFirstCall()
          .resolves([eventMilo1, eventMilo2])
          .onSecondCall()
          .resolves([])
      })
      it('crée un job sur redis pour chaque evenement', async () => {
        // When
        await handleJobSuivreEvenementsMiloHandler.handle()

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
        await handleJobSuivreEvenementsMiloHandler.handle()

        // Then
        expect(
          partenaireMiloRepository.acquitterEvenement
        ).to.have.been.calledWith(eventMilo1)
        expect(
          partenaireMiloRepository.acquitterEvenement
        ).to.have.been.calledWith(eventMilo2)
      })

      it("s'arrête quand milo ne retourne plus d'évènement", async () => {
        // Given
        partenaireMiloRepository.findAllEvenements
          .onFirstCall()
          .resolves([eventMilo1])
          .onSecondCall()
          .resolves([eventMilo2])
          .onThirdCall()
          .resolves([])

        // When
        await handleJobSuivreEvenementsMiloHandler.handle()

        // Then
        expect(partenaireMiloRepository.findAllEvenements).to.have.callCount(3)
        expect(
          planificateurService.creerJobEvenementMiloSiIlNaPasEteCreeAvant
        ).to.have.been.calledWith(eventMilo1)
        expect(
          planificateurService.creerJobEvenementMiloSiIlNaPasEteCreeAvant
        ).to.have.been.calledWith(eventMilo2)
        expect(
          partenaireMiloRepository.acquitterEvenement
        ).to.have.been.calledWith(eventMilo1)
        expect(
          partenaireMiloRepository.acquitterEvenement
        ).to.have.been.calledWith(eventMilo2)
      })
    })
  })
})
