import { expect, StubbedClass, stubClass } from '../../../utils'
import {
  HandleJobNotifierNouveauxServicesCiviqueCommandHandler,
  Stats
} from '../../../../src/application/commands/jobs/handle-job-notification-recherche-service-civique.command.handler'
import {
  isSuccess,
  Result,
  success
} from '../../../../src/building-blocks/types/result'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Recherche } from '../../../../src/domain/recherche'
import { Jeune } from '../../../../src/domain/jeune'
import { Notification } from '../../../../src/domain/notification'
import { OffreServiceCivique } from '../../../../src/domain/offre-service-civique'
import { createSandbox } from 'sinon'
import { DateService } from '../../../../src/utils/date-service'
import { DateTime } from 'luxon'
import { uneRecherche } from '../../../fixtures/recherche.fixture'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { GetServicesCiviqueQuery } from '../../../../src/application/queries/get-services-civique.query.handler'
import { uneOffreServiceCivique } from '../../../fixtures/offre-service-civique.fixture'

describe('HandleJobNotifierNouveauxServicesCiviqueCommandHandler', () => {
  describe('handle', () => {
    let rechercheRepository: StubbedType<Recherche.Repository>
    let jeuneRepository: StubbedType<Jeune.Repository>
    let notificationService: StubbedClass<Notification.Service>
    let offreEngagementRepository: StubbedType<OffreServiceCivique.Repository>
    let dateService: StubbedClass<DateService>

    let handleJobNotifierNouveauxServicesCiviqueCommandHandler: HandleJobNotifierNouveauxServicesCiviqueCommandHandler

    const now = DateTime.fromISO('2020-04-06T12:00:00.000Z').toUTC()
    const hier = DateTime.fromISO('2020-04-05T12:00:00.000Z').toUTC()

    const LIMITE_PAGINATION = 100

    let result: Result<Stats>

    beforeEach(() => {
      const sandbox = createSandbox()
      rechercheRepository = stubInterface(sandbox)
      jeuneRepository = stubInterface(sandbox)
      notificationRepository = stubInterface(sandbox)
      offreEngagementRepository = stubInterface(sandbox)
      dateService = stubClass(DateService)
      dateService.now.returns(now)

      handleJobNotifierNouveauxServicesCiviqueCommandHandler =
        new HandleJobNotifierNouveauxServicesCiviqueCommandHandler(
          rechercheRepository,
          jeuneRepository,
          notificationRepository,
          offreEngagementRepository,
          dateService
        )
    })

    describe("quand il n'y a pas de nouvelles offres depuis hier à 10 heures", () => {
      it('renvoie juste les stats', async () => {
        // Given
        offreEngagementRepository.findAll
          .withArgs({
            dateDeCreationMinimum: hier,
            page: 1,
            limit: 1000,
            editeur: OffreServiceCivique.Editeur.SERVICE_CIVIQUE
          })
          .resolves(success([]))

        // When
        const result =
          await handleJobNotifierNouveauxServicesCiviqueCommandHandler.handle()

        // Then
        expect(isSuccess(result)).to.equal(true)

        if (isSuccess(result)) {
          expect(result.data.nombreDeNouvellesOffres).to.equal(0)
        }
      })
    })
    describe('quand il y a une nouvelle offre depuis hier à 10 heures', () => {
      const uneOffre = uneOffreServiceCivique()

      beforeEach(() => {
        // Given
        offreEngagementRepository.findAll
          .withArgs({
            dateDeCreationMinimum: hier,
            page: 1,
            limit: 1000,
            editeur: OffreServiceCivique.Editeur.SERVICE_CIVIQUE
          })
          .resolves(success([uneOffre]))
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
            .withArgs(criteres, LIMITE_PAGINATION, 0)
            .resolves([])

          // When
          result =
            await handleJobNotifierNouveauxServicesCiviqueCommandHandler.handle()

          // Then
          expect(isSuccess(result)).to.equal(true)

          if (isSuccess(result)) {
            expect(result.data.nombreDeNouvellesOffres).to.equal(1)
            expect(result.data.recherchesCorrespondantes).to.equal(0)
          }
        })
      })
      describe('quand une recherche correspond', () => {
        beforeEach(async () => {
          // Given
          const criteres: GetServicesCiviqueQuery = {
            domaine: uneOffre.domaine,
            lat: uneOffre.localisation!.latitude,
            lon: uneOffre.localisation!.longitude,
            dateDeDebutMinimum: uneOffre.dateDeDebut
          }
          rechercheRepository.trouverLesRecherchesServicesCiviques
            .withArgs(criteres, LIMITE_PAGINATION, 0)
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
          expect(isSuccess(result)).to.equal(true)
          if (isSuccess(result)) {
            expect(result.data.nombreDeNouvellesOffres).to.equal(1)
            expect(result.data.recherchesCorrespondantes).to.equal(1)
          }
        })

        it('notifie le jeune', async () => {
          // Then
          expect(notificationRepository.send).to.have.been.calledWithExactly({
            token: 'unToken',
            notification: {
              title: 'Boulanger en alternance',
              body: 'De nouveaux résultats sont disponibles'
            },
            data: {
              type: 'NOUVELLE_OFFRE',
              id: '219e8ba5-cd88-4027-9828-55e8ca99a236'
            }
          })
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

        offreEngagementRepository.findAll
          .withArgs({
            dateDeCreationMinimum: hier,
            page: 1,
            limit: 1000,
            editeur: OffreServiceCivique.Editeur.SERVICE_CIVIQUE
          })
          .resolves(success([uneOffre]))

        const criteres: GetServicesCiviqueQuery = {
          domaine: uneOffre.domaine,
          lat: uneOffre.localisation!.latitude,
          lon: uneOffre.localisation!.longitude,
          dateDeDebutMinimum: uneOffre.dateDeDebut
        }
        const centRecherches = Array.from({ length: 100 }).fill(uneRecherche())
        rechercheRepository.trouverLesRecherchesServicesCiviques
          .withArgs(criteres, LIMITE_PAGINATION, 0)
          .resolves(centRecherches)
          .withArgs(criteres, LIMITE_PAGINATION, 100)
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
        const uneOffreSansLocalisation: OffreServiceCivique = {
          ...uneOffreServiceCivique(),
          localisation: undefined
        }

        offreEngagementRepository.findAll
          .withArgs({
            dateDeCreationMinimum: hier,
            page: 1,
            limit: 1000,
            editeur: OffreServiceCivique.Editeur.SERVICE_CIVIQUE
          })
          .resolves(success([uneOffreSansLocalisation]))

        // When
        const result =
          await handleJobNotifierNouveauxServicesCiviqueCommandHandler.handle()

        // Then
        expect(isSuccess(result)).to.be.true()
      })
    })
  })
})
