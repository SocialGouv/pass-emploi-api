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
      planificateurRepository.estEnCoursDeTraitement.resolves(true)

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
      planificateurRepository.estEnCoursDeTraitement.resolves(false)
    })

    describe('quand il y a au moins un évènement milo', () => {
      let eventMilo1RDV: EvenementMilo
      let eventMilo1RDVIdentique: EvenementMilo
      let eventMilo2RDV: EvenementMilo
      let eventMilo1Session: EvenementMilo
      let eventMilo1SessionIdentique: EvenementMilo
      let eventMilo2Session: EvenementMilo

      beforeEach(() => {
        // Given
        eventMilo1RDV = unEvenementMilo({
          id: 'un-evenement',
          date: uneDatetime().plus({ minute: 1 }).toISO()
        })
        eventMilo1RDVIdentique = unEvenementMilo({
          id: 'un-evenement-mais-identique',
          date: uneDatetime().toISO()
        })
        eventMilo2RDV = unEvenementMilo({
          id: 'un-autre-evenement',
          idObjet: '35'
        })
        eventMilo1Session = unEvenementMilo({
          id: 'un-evenement-session',
          date: uneDatetime().plus({ minute: 1 }).toISO(),
          objet: EvenementMilo.ObjetEvenement.SESSION
        })
        eventMilo1SessionIdentique = unEvenementMilo({
          id: 'un-evenement-mais-identique-session',
          date: uneDatetime().toISO(),
          objet: EvenementMilo.ObjetEvenement.SESSION
        })
        eventMilo2Session = unEvenementMilo({
          id: 'un-autre-evenement-session',
          idObjet: '35',
          objet: EvenementMilo.ObjetEvenement.SESSION
        })
        evenementMiloRepository.findAllEvenements
          .onFirstCall()
          .resolves([
            eventMilo1RDV,
            eventMilo2RDV,
            eventMilo1RDVIdentique,
            eventMilo1Session,
            eventMilo1SessionIdentique,
            eventMilo2Session
          ])
          .onSecondCall()
          .resolves([])
      })
      it('crée un job sur redis pour chaque evenement non identique', async () => {
        // When
        await suivreEvenementsMiloHandler.handle()

        // Then
        expect(
          planificateurService.ajouterJobEvenementMiloSiIlNaPasEteCreeAvant
        ).to.have.callCount(5)
        expect(
          planificateurService.ajouterJobEvenementMiloSiIlNaPasEteCreeAvant
        ).to.have.been.calledWith(eventMilo1RDV)
        expect(
          planificateurService.ajouterJobEvenementMiloSiIlNaPasEteCreeAvant
        ).to.have.been.calledWith(eventMilo1RDVIdentique)
        expect(
          planificateurService.ajouterJobEvenementMiloSiIlNaPasEteCreeAvant
        ).to.have.been.calledWith(eventMilo2RDV)
        expect(
          planificateurService.ajouterJobEvenementMiloSiIlNaPasEteCreeAvant
        ).to.have.been.calledWith(eventMilo1Session)
        expect(
          planificateurService.ajouterJobEvenementMiloSiIlNaPasEteCreeAvant
        ).to.have.been.calledWith(eventMilo2Session)
      })
      it('acquitte chaque évènement', async () => {
        // When
        await suivreEvenementsMiloHandler.handle()

        // Then
        expect(evenementMiloRepository.acquitterEvenement).to.have.callCount(6)
        expect(
          evenementMiloRepository.acquitterEvenement
        ).to.have.been.calledWith(eventMilo1RDV)
        expect(
          evenementMiloRepository.acquitterEvenement
        ).to.have.been.calledWith(eventMilo1RDVIdentique)
        expect(
          evenementMiloRepository.acquitterEvenement
        ).to.have.been.calledWith(eventMilo2RDV)
        expect(
          evenementMiloRepository.acquitterEvenement
        ).to.have.been.calledWith(eventMilo1Session)
        expect(
          evenementMiloRepository.acquitterEvenement
        ).to.have.been.calledWith(eventMilo1SessionIdentique)
        expect(
          evenementMiloRepository.acquitterEvenement
        ).to.have.been.calledWith(eventMilo2Session)
      })

      it("s'arrête quand milo ne retourne plus d'évènement", async () => {
        // Given
        evenementMiloRepository.findAllEvenements
          .onFirstCall()
          .resolves([eventMilo1RDV])
          .onSecondCall()
          .resolves([eventMilo2RDV])
          .onThirdCall()
          .resolves([])

        // When
        await suivreEvenementsMiloHandler.handle()

        // Then
        expect(evenementMiloRepository.findAllEvenements).to.have.callCount(3)
        expect(
          planificateurService.ajouterJobEvenementMiloSiIlNaPasEteCreeAvant
        ).to.have.been.calledWith(eventMilo1RDV)
        expect(
          planificateurService.ajouterJobEvenementMiloSiIlNaPasEteCreeAvant
        ).to.have.been.calledWith(eventMilo2RDV)
        expect(
          evenementMiloRepository.acquitterEvenement
        ).to.have.been.calledWith(eventMilo1RDV)
        expect(
          evenementMiloRepository.acquitterEvenement
        ).to.have.been.calledWith(eventMilo2RDV)
      })
    })
  })
})
