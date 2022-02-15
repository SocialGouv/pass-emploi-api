import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { NotifierNouvellesOffresEmploiCommandHandler } from 'src/application/commands/jobs/handle-job-notification-recherche.command'
import { Notification } from 'src/domain/notification'
import {
  Contrat,
  Duree,
  Experience,
  OffresEmploi
} from 'src/domain/offre-emploi'
import { Recherche } from 'src/domain/recherche'
import { DateService } from 'src/utils/date-service'
import {
  uneDatetime,
  uneDatetimeMoinsRecente
} from 'test/fixtures/date.fixture'
import { uneRecherche } from 'test/fixtures/recherche.fixture'
import { GetOffresEmploiQuery } from '../../../../src/application/queries/get-offres-emploi.query.handler'
import { OffresEmploiQueryModel } from '../../../../src/application/queries/query-models/offres-emploi.query-models'
import { Jeune } from '../../../../src/domain/jeune'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { uneOffreEmploiResumeQueryModel } from '../../../fixtures/offre-emploi.fixture'
import { createSandbox, expect, stubClass } from '../../../utils'
import { failure, success } from '../../../../src/building-blocks/types/result'
import { ErreurHttp } from '../../../../src/building-blocks/types/domain-error'
import { testConfig } from '../../../utils/module-for-testing'

describe('NotifierNouvellesOffresEmploiCommandHandler', () => {
  let notifierNouvellesOffresEmploiCommandHandler: NotifierNouvellesOffresEmploiCommandHandler
  let rechercheRepository: StubbedType<Recherche.Repository>
  let offresEmploiRepository: StubbedType<OffresEmploi.Repository>
  let notificationRepository: StubbedType<Notification.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>

  const date = uneDatetime

  const offresEmploiQueryModelSansResultats: OffresEmploiQueryModel = {
    pagination: {
      page: 1,
      limit: 50
    },
    results: []
  }

  const offresEmploiQueryModel: OffresEmploiQueryModel = {
    pagination: {
      page: 1,
      limit: 50
    },
    results: [uneOffreEmploiResumeQueryModel()]
  }

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    rechercheRepository = stubInterface(sandbox)
    offresEmploiRepository = stubInterface(sandbox)
    notificationRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)

    const dateService = stubClass(DateService)
    dateService.now.returns(date)

    notifierNouvellesOffresEmploiCommandHandler =
      new NotifierNouvellesOffresEmploiCommandHandler(
        dateService,
        rechercheRepository,
        offresEmploiRepository,
        notificationRepository,
        jeuneRepository,
        testConfig()
      )
  })

  describe('quand tout va bien', () => {
    describe('quand il y a moins de 5 recherches', () => {
      const idJeune = '1'
      const dateDerniereRecherche = uneDatetimeMoinsRecente

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
        offresEmploiRepository.findAll.resolves(
          success(offresEmploiQueryModelSansResultats)
        )

        // When
        await notifierNouvellesOffresEmploiCommandHandler.handle({})

        // Then
        expect(offresEmploiRepository.findAll).to.have.callCount(2)
        expect(offresEmploiRepository.findAll).to.have.been.calledWith(
          1,
          2,
          undefined,
          'test1',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          dateDerniereRecherche
        )
        expect(offresEmploiRepository.findAll).to.have.been.calledWith(
          1,
          2,
          undefined,
          'test2',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          dateDerniereRecherche
        )
      })
      it('recupère les nouvelles offres avec tous les criteres', async () => {
        // Given
        const dateDerniereRecherche = date

        const criteres: GetOffresEmploiQuery = {
          q: 'boulanger',
          departement: '75',
          alternance: false,
          experience: [
            Experience.moinsdUnAn,
            Experience.entreUnEtTroisAns,
            Experience.plusDeTroisAns
          ],
          contrat: [Contrat.autre, Contrat.cdi, Contrat.cdd],
          duree: [Duree.tempsPartiel, Duree.tempsPlein],
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

        offresEmploiRepository.findAll.resolves(
          success(offresEmploiQueryModelSansResultats)
        )

        // When
        await notifierNouvellesOffresEmploiCommandHandler.handle({})

        // Then
        expect(offresEmploiRepository.findAll).to.have.been.calledWithExactly(
          1,
          2,
          criteres.alternance,
          criteres.q,
          criteres.departement,
          criteres.experience,
          criteres.duree,
          criteres.contrat,
          criteres.rayon,
          criteres.commune,
          dateDerniereRecherche
        )
      })
      it('envoie une notification', async () => {
        // Given
        offresEmploiRepository.findAll
          .resolves(success(offresEmploiQueryModelSansResultats))
          .withArgs(1, 2, undefined, criteresRecherche1.q)
          .resolves(success(offresEmploiQueryModel))

        jeuneRepository.get.withArgs(idJeune).resolves(unJeune())

        // When
        await notifierNouvellesOffresEmploiCommandHandler.handle({})

        // Then
        expect(notificationRepository.send).to.have.been.calledWithExactly({
          token: 'unToken',
          notification: {
            title: 'Boulanger en alternance',
            body: 'De nouveaux résultats sont disponibles'
          },
          data: {
            type: 'NOUVELLE_OFFRE',
            sousType: 'OFFRES_EMPLOI',
            id: '219e8ba5-cd88-4027-9828-55e8ca99a236'
          }
        })
      })
      it("met à jour la date de dernière recherche d'une recherche", async () => {
        // Given

        const offresEmploiQueryModel: OffresEmploiQueryModel = {
          pagination: {
            page: 1,
            limit: 50
          },
          results: [uneOffreEmploiResumeQueryModel()]
        }
        offresEmploiRepository.findAll.resolves(success(offresEmploiQueryModel))

        // When
        await notifierNouvellesOffresEmploiCommandHandler.handle({})

        // Then
        expect(
          rechercheRepository.saveRecherche
        ).to.have.been.calledWithExactly(
          uneRecherche({
            type: Recherche.Type.OFFRES_EMPLOI,
            criteres: criteresRecherche1,
            idJeune,
            dateDerniereRecherche: date
          })
        )
        expect(
          rechercheRepository.saveRecherche
        ).to.have.been.calledWithExactly(
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

        offresEmploiRepository.findAll.resolves(
          success(offresEmploiQueryModelSansResultats)
        )

        // When
        await notifierNouvellesOffresEmploiCommandHandler.handle({})

        // Then
        expect(offresEmploiRepository.findAll).to.have.callCount(6)
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
        await notifierNouvellesOffresEmploiCommandHandler.handle({})

        // Then
        expect(offresEmploiRepository.findAll).to.have.callCount(0)
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
        offresEmploiRepository.findAll
          .onFirstCall()
          .resolves(failure(new ErreurHttp('Bad bad request', 400)))
          .onSecondCall()
          .resolves(success(offresEmploiQueryModel))

        jeuneRepository.get.withArgs(idJeune).resolves(unJeune())

        // When
        await notifierNouvellesOffresEmploiCommandHandler.handle({})

        // Then
        expect(offresEmploiRepository.findAll).to.have.callCount(2)
        expect(rechercheRepository.saveRecherche).to.have.callCount(2)
        expect(
          rechercheRepository.saveRecherche
        ).to.have.been.calledWithExactly(
          uneRecherche({
            id: '219e8ba5-cd88-4027-9828-55e8ca99a232',
            type: Recherche.Type.OFFRES_EMPLOI,
            criteres: criteresRecherche2,
            idJeune,
            dateDerniereRecherche: date
          })
        )
        expect(notificationRepository.send).to.have.callCount(1)
        expect(notificationRepository.send).to.have.been.calledWithExactly({
          token: 'unToken',
          notification: {
            title: 'Boulanger en alternance',
            body: 'De nouveaux résultats sont disponibles'
          },
          data: {
            type: 'NOUVELLE_OFFRE',
            sousType: 'OFFRES_EMPLOI',
            id: '219e8ba5-cd88-4027-9828-55e8ca99a232'
          }
        })
      })
    })
  })
})
