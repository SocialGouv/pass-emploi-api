import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Notification } from 'src/domain/notification/notification'
import { Recherche } from 'src/domain/offre/recherche/recherche'
import { DateService } from 'src/utils/date-service'
import {
  uneDatetime,
  uneDatetimeMoinsRecente
} from 'test/fixtures/date.fixture'
import { uneRecherche } from 'test/fixtures/recherche.fixture'
import { GetOffresEmploiQuery } from '../../../../src/application/queries/get-offres-emploi.query.handler'
import { OffresEmploiQueryModel } from '../../../../src/application/queries/query-models/offres-emploi.query-model'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { uneOffreEmploiResumeQueryModel } from '../../../fixtures/offre-emploi.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import { failure, success } from '../../../../src/building-blocks/types/result'
import { ErreurHttp } from '../../../../src/building-blocks/types/domain-error'
import { testConfig } from '../../../utils/module-for-testing'
import { HandleJobNotifierNouvellesOffresEmploiCommandHandler } from '../../../../src/application/commands/jobs/handle-job-notifier-nouvelles-offres-emploi.command'
import { FindAllOffresEmploiQueryGetter } from '../../../../src/application/queries/query-getters/find-all-offres-emploi.query.getter'
import { SuiviJob } from 'src/domain/suivi-job'
import { Offre } from '../../../../src/domain/offre/offre'

describe('NotifierNouvellesOffresEmploiCommandHandler', () => {
  let notifierNouvellesOffresEmploiCommandHandler: HandleJobNotifierNouvellesOffresEmploiCommandHandler
  let rechercheRepository: StubbedType<Recherche.Repository>
  let findAllOffresEmploiQueryGetter: StubbedClass<FindAllOffresEmploiQueryGetter>
  let notificationService: StubbedClass<Notification.Service>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let suiviJobService: StubbedType<SuiviJob.Service>

  const date = uneDatetime()

  const offresEmploiQueryModelSansResultats: OffresEmploiQueryModel = {
    pagination: {
      page: 1,
      limit: 50,
      total: 0
    },
    results: []
  }

  const offresEmploiQueryModel: OffresEmploiQueryModel = {
    pagination: {
      page: 1,
      limit: 50,
      total: 1
    },
    results: [uneOffreEmploiResumeQueryModel()]
  }

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    rechercheRepository = stubInterface(sandbox)
    findAllOffresEmploiQueryGetter = stubClass(FindAllOffresEmploiQueryGetter)
    notificationService = stubClass(Notification.Service)
    notificationService.notifierNouvellesOffres.resolves()
    jeuneRepository = stubInterface(sandbox)
    suiviJobService = stubInterface(sandbox)

    const dateService = stubClass(DateService)
    dateService.now.returns(date)

    notifierNouvellesOffresEmploiCommandHandler =
      new HandleJobNotifierNouvellesOffresEmploiCommandHandler(
        dateService,
        rechercheRepository,
        findAllOffresEmploiQueryGetter,
        notificationService,
        jeuneRepository,
        testConfig(),
        suiviJobService
      )
  })

  describe('quand tout va bien', () => {
    describe('quand il y a moins de 5 recherches', () => {
      const idJeune = '1'
      const dateDerniereRecherche = uneDatetimeMoinsRecente()

      let criteresRecherche1: GetOffresEmploiQuery
      let criteresRecherche2: GetOffresEmploiQuery
      let recherches: Recherche[]

      beforeEach(async () => {
        criteresRecherche1 = { q: 'test1' }
        criteresRecherche2 = { q: 'test2' }
        recherches = [
          uneRecherche({
            type: Recherche.Type.OFFRES_EMPLOI,
            criteres: criteresRecherche1,
            idJeune,
            dateDerniereRecherche
          }),
          uneRecherche({
            type: Recherche.Type.OFFRES_EMPLOI,
            criteres: criteresRecherche2,
            idJeune,
            dateDerniereRecherche
          })
        ]

        rechercheRepository.findAvantDate
          .withArgs(
            [Recherche.Type.OFFRES_EMPLOI, Recherche.Type.OFFRES_ALTERNANCE],
            5,
            date
          )
          .onFirstCall()
          .resolves(recherches)
          .onSecondCall()
          .resolves([])
      })
      it('recupère les nouvelles offres', async () => {
        // Given
        findAllOffresEmploiQueryGetter.handle.resolves(
          success(offresEmploiQueryModelSansResultats)
        )

        // When
        await notifierNouvellesOffresEmploiCommandHandler.handle()

        // Then
        expect(findAllOffresEmploiQueryGetter.handle).to.have.callCount(2)
        const expectedFirstCall: GetOffresEmploiQuery = {
          page: 1,
          limit: 2,
          q: 'test1',
          minDateCreation: dateDerniereRecherche.toISO()
        }
        expect(findAllOffresEmploiQueryGetter.handle).to.have.been.calledWith(
          expectedFirstCall
        )
        const expectedSecondCall: GetOffresEmploiQuery = {
          page: 1,
          limit: 2,
          q: 'test2',
          minDateCreation: dateDerniereRecherche.toISO()
        }
        expect(findAllOffresEmploiQueryGetter.handle).to.have.been.calledWith(
          expectedSecondCall
        )
      })
      it('recupère les nouvelles offres avec tous les criteres', async () => {
        // Given
        const dateDerniereRecherche = date

        const criteres: GetOffresEmploiQuery = {
          q: 'boulanger',
          departement: '75',
          alternance: 'false',
          experience: [
            Offre.Emploi.Experience.moinsdUnAn,
            Offre.Emploi.Experience.entreUnEtTroisAns,
            Offre.Emploi.Experience.plusDeTroisAns
          ],
          debutantAccepte: true,
          contrat: [
            Offre.Emploi.Contrat.autre,
            Offre.Emploi.Contrat.cdi,
            Offre.Emploi.Contrat.cdd
          ],
          duree: [
            Offre.Emploi.Duree.tempsPartiel,
            Offre.Emploi.Duree.tempsPlein
          ],
          rayon: 100,
          commune: '75015'
        }

        rechercheRepository.findAvantDate
          .withArgs(
            [Recherche.Type.OFFRES_EMPLOI, Recherche.Type.OFFRES_ALTERNANCE],
            5,
            date
          )
          .onFirstCall()
          .resolves([
            uneRecherche({
              type: Recherche.Type.OFFRES_EMPLOI,
              criteres,
              idJeune,
              dateDerniereRecherche
            })
          ])
          .onSecondCall()
          .resolves([])

        findAllOffresEmploiQueryGetter.handle.resolves(
          success(offresEmploiQueryModelSansResultats)
        )

        // When
        await notifierNouvellesOffresEmploiCommandHandler.handle()

        // Then
        const expected: GetOffresEmploiQuery = {
          page: 1,
          limit: 2,
          q: criteres.q,
          departement: criteres.departement,
          alternance: criteres.alternance,
          experience: criteres.experience,
          debutantAccepte: criteres.debutantAccepte,
          contrat: criteres.contrat,
          duree: criteres.duree,
          rayon: criteres.rayon,
          commune: criteres.commune,
          minDateCreation: dateDerniereRecherche.toISO()
        }
        expect(
          findAllOffresEmploiQueryGetter.handle
        ).to.have.been.calledWithExactly(expected)
      })
      it('envoie une notification', async () => {
        // Given
        const criteres: GetOffresEmploiQuery = {
          page: 1,
          limit: 2,
          q: criteresRecherche1.q,
          minDateCreation: dateDerniereRecherche.toISO()
        }
        findAllOffresEmploiQueryGetter.handle
          .resolves(success(offresEmploiQueryModelSansResultats))
          .withArgs(criteres)
          .resolves(success(offresEmploiQueryModel))

        jeuneRepository.get.withArgs(idJeune).resolves(unJeune())

        // When
        await notifierNouvellesOffresEmploiCommandHandler.handle()

        // Then
        expect(
          notificationService.notifierNouvellesOffres
        ).to.have.been.calledOnceWithExactly(recherches[0], unJeune())
      })
      it("met à jour la date de dernière recherche d'une recherche", async () => {
        // Given

        const offresEmploiQueryModel: OffresEmploiQueryModel = {
          pagination: {
            page: 1,
            limit: 50,
            total: 1
          },
          results: [uneOffreEmploiResumeQueryModel()]
        }
        findAllOffresEmploiQueryGetter.handle.resolves(
          success(offresEmploiQueryModel)
        )

        // When
        await notifierNouvellesOffresEmploiCommandHandler.handle()

        // Then
        expect(rechercheRepository.update).to.have.been.calledWithExactly(
          uneRecherche({
            type: Recherche.Type.OFFRES_EMPLOI,
            criteres: criteresRecherche1,
            idJeune,
            dateDerniereRecherche: date
          })
        )
        expect(rechercheRepository.update).to.have.been.calledWithExactly(
          uneRecherche({
            type: Recherche.Type.OFFRES_EMPLOI,
            criteres: criteresRecherche2,
            idJeune,
            dateDerniereRecherche: date
          })
        )
      })
    })

    describe('quand il y a plus de 5 recherches', () => {
      it('recupère les nouvelles offres quand il y a plus de 5 recherches', async () => {
        // Given
        const recherches1 = [
          uneRecherche({
            type: Recherche.Type.OFFRES_EMPLOI,
            criteres: { q: 'test1' }
          }),
          uneRecherche({
            type: Recherche.Type.OFFRES_EMPLOI,
            criteres: { q: 'test2' }
          }),
          uneRecherche({
            type: Recherche.Type.OFFRES_EMPLOI,
            criteres: { q: 'test3' }
          }),
          uneRecherche({
            type: Recherche.Type.OFFRES_EMPLOI,
            criteres: { q: 'test4' }
          }),
          uneRecherche({
            type: Recherche.Type.OFFRES_EMPLOI,
            criteres: { q: 'test5' }
          })
        ]
        const recherches2 = [
          uneRecherche({
            type: Recherche.Type.OFFRES_EMPLOI,
            criteres: { q: 'test1' }
          })
        ]
        const nombreRecherches = 5
        rechercheRepository.findAvantDate
          .withArgs(
            [Recherche.Type.OFFRES_EMPLOI, Recherche.Type.OFFRES_ALTERNANCE],
            nombreRecherches,
            date
          )
          .onFirstCall()
          .resolves(recherches1)
          .onSecondCall()
          .resolves(recherches2)
          .onThirdCall()
          .resolves([])

        findAllOffresEmploiQueryGetter.handle.resolves(
          success(offresEmploiQueryModelSansResultats)
        )

        // When
        await notifierNouvellesOffresEmploiCommandHandler.handle()

        // Then
        expect(findAllOffresEmploiQueryGetter.handle).to.have.callCount(6)
      })
    })

    describe("quand il n'y a pas de recherches", () => {
      it('n"essaie pas de récupérer les offres', async () => {
        // Given
        const nombreRecherches = 5
        rechercheRepository.findAvantDate
          .withArgs(
            [Recherche.Type.OFFRES_EMPLOI, Recherche.Type.OFFRES_ALTERNANCE],
            nombreRecherches,
            date
          )
          .resolves([])

        // When
        await notifierNouvellesOffresEmploiCommandHandler.handle()

        // Then
        expect(findAllOffresEmploiQueryGetter.handle).to.have.callCount(0)
      })
    })
  })
  describe("quand il y'a des erreurs", () => {
    describe("quand il y a une recherche d'offres qui échoue", () => {
      const idJeune = '1'

      let criteresRecherche1: GetOffresEmploiQuery
      let criteresRecherche2: GetOffresEmploiQuery
      let recherches: Recherche[]

      beforeEach(async () => {
        criteresRecherche1 = { q: 'test1' }
        criteresRecherche2 = { q: 'test2' }
        recherches = [
          uneRecherche({
            id: '219e8ba5-cd88-4027-9828-55e8ca99a231',
            type: Recherche.Type.OFFRES_EMPLOI,
            criteres: criteresRecherche1,
            idJeune
          }),
          uneRecherche({
            id: '219e8ba5-cd88-4027-9828-55e8ca99a232',
            type: Recherche.Type.OFFRES_EMPLOI,
            criteres: criteresRecherche2,
            idJeune
          })
        ]

        rechercheRepository.findAvantDate
          .withArgs(
            [Recherche.Type.OFFRES_EMPLOI, Recherche.Type.OFFRES_ALTERNANCE],
            5,
            date
          )
          .onFirstCall()
          .resolves(recherches)
          .onSecondCall()
          .resolves([])
      })
      it('envoie les notifs que pour les recherches en succès', async () => {
        // Given
        findAllOffresEmploiQueryGetter.handle
          .onFirstCall()
          .resolves(failure(new ErreurHttp('Bad bad request', 400)))
          .onSecondCall()
          .resolves(success(offresEmploiQueryModel))

        jeuneRepository.get.withArgs(idJeune).resolves(unJeune())

        // When
        await notifierNouvellesOffresEmploiCommandHandler.handle()

        // Then
        expect(findAllOffresEmploiQueryGetter.handle).to.have.callCount(2)
        expect(rechercheRepository.update).to.have.callCount(2)
        expect(rechercheRepository.update).to.have.been.calledWithExactly(
          uneRecherche({
            ...recherches[1],
            dateDerniereRecherche: date
          })
        )
        expect(notificationService.notifierNouvellesOffres).to.have.callCount(1)
        expect(
          notificationService.notifierNouvellesOffres
        ).to.have.been.calledWithExactly(recherches[1], unJeune())
      })
    })
  })
})
