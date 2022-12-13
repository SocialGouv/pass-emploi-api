import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { createSandbox } from 'sinon'
import { SuiviJob } from 'src/domain/suivi-job'
import { HandleJobNotifierNouveauxServicesCiviqueCommandHandler } from '../../../../src/application/commands/jobs/handle-job-notification-recherche-service-civique.command.handler'
import { GetServicesCiviqueQuery } from '../../../../src/application/queries/get-offres-services-civique.query.handler'
import { FindAllOffresServicesCiviqueQueryGetter } from '../../../../src/application/queries/query-getters/find-all-offres-services-civique.query.getter'
import { success } from '../../../../src/building-blocks/types/result'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { Notification } from '../../../../src/domain/notification/notification'
import { Offre } from '../../../../src/domain/offre/offre'
import { Recherche } from '../../../../src/domain/offre/recherche/recherche'
import { DateService } from '../../../../src/utils/date-service'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { uneOffreServiceCivique } from '../../../fixtures/offre-service-civique.fixture'
import { uneRecherche } from '../../../fixtures/recherche.fixture'
import { expect, StubbedClass, stubClass } from '../../../utils'

describe('HandleJobNotifierNouveauxServicesCiviqueCommandHandler', () => {
  describe('handle', () => {
    let rechercheRepository: StubbedType<Recherche.Repository>
    let jeuneRepository: StubbedType<Jeune.Repository>
    let notificationService: StubbedClass<Notification.Service>
    let findAllOffresServicesCiviqueQueryGetter: StubbedClass<FindAllOffresServicesCiviqueQueryGetter>
    let dateService: StubbedClass<DateService>
    let suiviJobService: StubbedType<SuiviJob.Service>

    let handleJobNotifierNouveauxServicesCiviqueCommandHandler: HandleJobNotifierNouveauxServicesCiviqueCommandHandler

    const now = DateTime.fromISO('2020-04-06T12:00:00.000Z')
    const aujourdhuiAMinuit = now.set({ hour: 0, minute: 0, second: 0 })
    const hier = DateTime.fromISO('2020-04-05T12:00:00.000Z').toISO()

    const LIMITE_PAGINATION = 100

    beforeEach(() => {
      const sandbox = createSandbox()
      rechercheRepository = stubInterface(sandbox)
      jeuneRepository = stubInterface(sandbox)
      notificationService = stubClass(Notification.Service)
      findAllOffresServicesCiviqueQueryGetter = stubClass(
        FindAllOffresServicesCiviqueQueryGetter
      )
      dateService = stubClass(DateService)
      dateService.now.returns(now)
      notificationService.notifierNouvellesOffres.resolves()
      suiviJobService = stubInterface(sandbox)

      handleJobNotifierNouveauxServicesCiviqueCommandHandler =
        new HandleJobNotifierNouveauxServicesCiviqueCommandHandler(
          rechercheRepository,
          jeuneRepository,
          notificationService,
          findAllOffresServicesCiviqueQueryGetter,
          dateService,
          suiviJobService
        )
    })

    describe("quand il n'y a pas de nouvelles offres depuis hier à 10 heures", () => {
      it('renvoie juste les stats', async () => {
        // Given
        findAllOffresServicesCiviqueQueryGetter.handle
          .withArgs({
            page: 1,
            limit: 1000,
            dateDeCreationMinimum: hier
          })
          .resolves(success({ total: 0, results: [] }))

        // When
        const result =
          await handleJobNotifierNouveauxServicesCiviqueCommandHandler.handle()

        // Then
        expect(result.succes).to.equal(true)
        expect(result.resultat).to.deep.equal({
          nombreDeNouvellesOffres: 0,
          recherchesCorrespondantes: 0
        })
      })
    })
    describe('quand il y a une nouvelle offre depuis hier à 10 heures', () => {
      const uneOffre = uneOffreServiceCivique()

      beforeEach(() => {
        // Given
        findAllOffresServicesCiviqueQueryGetter.handle
          .withArgs({
            page: 1,
            limit: 1000,
            dateDeCreationMinimum: hier
          })
          .resolves(success({ total: 1, results: [uneOffre] }))
      })
      describe('quand aucune recherche ne correspond', () => {
        it('renvoie juste les stats', async () => {
          // Given
          const criteres: GetServicesCiviqueQuery = {
            domaine: uneOffre.domaine,
            lat: uneOffre.localisation!.latitude,
            lon: uneOffre.localisation!.longitude,
            dateDeDebutMinimum: uneOffre.dateDeDebut
          }
          rechercheRepository.trouverLesRecherchesServicesCiviques
            .withArgs(criteres, LIMITE_PAGINATION, 0, aujourdhuiAMinuit)
            .resolves([])

          // When
          const result =
            await handleJobNotifierNouveauxServicesCiviqueCommandHandler.handle()

          // Then
          expect(result.succes).to.equal(true)
          expect(result.resultat).to.deep.equal({
            nombreDeNouvellesOffres: 1,
            recherchesCorrespondantes: 0
          })
        })
      })
      describe('quand une recherche correspond', () => {
        let result: SuiviJob
        beforeEach(async () => {
          // Given
          const criteres: GetServicesCiviqueQuery = {
            domaine: uneOffre.domaine,
            lat: uneOffre.localisation!.latitude,
            lon: uneOffre.localisation!.longitude,
            dateDeDebutMinimum: uneOffre.dateDeDebut
          }
          rechercheRepository.trouverLesRecherchesServicesCiviques
            .withArgs(criteres, LIMITE_PAGINATION, 0, aujourdhuiAMinuit)
            .resolves([uneRecherche()])

          jeuneRepository.get
            .withArgs(uneRecherche().idJeune)
            .resolves(unJeune())

          // When
          result =
            await handleJobNotifierNouveauxServicesCiviqueCommandHandler.handle()
        })
        it('renvoie les stats', async () => {
          // Then
          expect(result.succes).to.equal(true)
          expect(result.resultat).to.deep.equal({
            nombreDeNouvellesOffres: 1,
            recherchesCorrespondantes: 1
          })
        })

        it('notifie le jeune', async () => {
          // Then
          expect(
            notificationService.notifierNouvellesOffres
          ).to.have.been.calledOnceWithExactly(uneRecherche(), unJeune())
        })

        it('met à jour la recherche', async () => {
          // Then
          expect(rechercheRepository.update).to.have.been.calledWithExactly({
            ...uneRecherche(),
            dateDerniereRecherche: now,
            etat: Recherche.Etat.SUCCES
          })
        })
      })
    })
    describe('quand il y a une offre qui répond aux critères de plus de 100 recherches', () => {
      it('fais la recherche en 2 fois', async () => {
        // Given
        const uneOffre = uneOffreServiceCivique()

        findAllOffresServicesCiviqueQueryGetter.handle
          .withArgs({
            page: 1,
            limit: 1000,
            dateDeCreationMinimum: hier
          })
          .resolves(success({ total: 1, results: [uneOffre] }))

        const criteres: GetServicesCiviqueQuery = {
          domaine: uneOffre.domaine,
          lat: uneOffre.localisation!.latitude,
          lon: uneOffre.localisation!.longitude,
          dateDeDebutMinimum: uneOffre.dateDeDebut
        }
        const centRecherches = Array.from({ length: 100 }).fill(uneRecherche())
        rechercheRepository.trouverLesRecherchesServicesCiviques
          .withArgs(criteres, LIMITE_PAGINATION, 0, aujourdhuiAMinuit)
          .resolves(centRecherches)
          .withArgs(criteres, LIMITE_PAGINATION, 100, aujourdhuiAMinuit)
          .resolves([uneRecherche()])

        jeuneRepository.get.withArgs(uneRecherche().idJeune).resolves(unJeune())

        // When
        await handleJobNotifierNouveauxServicesCiviqueCommandHandler.handle()

        // Then
        expect(
          rechercheRepository.trouverLesRecherchesServicesCiviques
        ).to.have.callCount(2)
      })
    })
    describe('quand il y a une offre sans localisation', () => {
      it("passe à l'offre suivante", async () => {
        // Given
        const uneOffreSansLocalisation: Offre.Favori.ServiceCivique = {
          ...uneOffreServiceCivique(),
          localisation: undefined
        }

        findAllOffresServicesCiviqueQueryGetter.handle
          .withArgs({
            page: 1,
            limit: 1000,
            dateDeCreationMinimum: hier
          })
          .resolves(success({ total: 1, results: [uneOffreSansLocalisation] }))

        // When
        const result =
          await handleJobNotifierNouveauxServicesCiviqueCommandHandler.handle()

        // Then
        expect(result.succes).to.be.true()
      })
    })
  })
})
