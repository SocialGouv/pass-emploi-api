import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import {
  GetOffresEmploiQuery,
  GetOffresEmploiQueryHandler
} from '../../../src/application/queries/get-offres-emploi.query.handler'
import {
  Contrat,
  Duree,
  Experience,
  OffresEmploi
} from '../../../src/domain/offre-emploi'
import { desOffresEmploiQueryModel } from '../../fixtures/query-models/offre-emploi.query-model.fixtures'
import { success } from '../../../src/building-blocks/types/result'

describe('GetOffresEmploiQueryHandler', () => {
  let offreEmploiRepo: StubbedType<OffresEmploi.Repository>
  let getOffresEmploiQueryHandler: GetOffresEmploiQueryHandler
  let sandbox: SinonSandbox
  let evenementService: StubbedClass<EvenementService>

  before(() => {
    sandbox = createSandbox()
    offreEmploiRepo = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)

    getOffresEmploiQueryHandler = new GetOffresEmploiQueryHandler(
      offreEmploiRepo,
      evenementService
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    describe('avec tous les critères remplis', () => {
      it('retourne des offres', async () => {
        // Given
        const getOffresEmploiQuery: GetOffresEmploiQuery = {
          page: 2,
          limit: 52,
          q: 'boulanger',
          departement: '75',
          alternance: true,
          debutantAccepte: false,
          contrat: [Contrat.cdd],
          duree: [Duree.tempsPlein]
        }

        offreEmploiRepo.findAll
          .withArgs(getOffresEmploiQuery)
          .resolves(success(desOffresEmploiQueryModel()))

        // When
        const result = await getOffresEmploiQueryHandler.handle(
          getOffresEmploiQuery
        )

        // Then
        expect(result).to.deep.equal(success(desOffresEmploiQueryModel()))
      })
    })
    describe('sans la page et la limite', () => {
      it('retourne des offres avec des valeurs par défaut', async () => {
        // Given
        const getOffresEmploiQuery: GetOffresEmploiQuery = {
          q: 'boulanger',
          departement: '75',
          alternance: true,
          debutantAccepte: false,
          contrat: [Contrat.cdd],
          duree: [Duree.tempsPlein]
        }

        offreEmploiRepo.findAll
          .withArgs({ ...getOffresEmploiQuery, page: 1, limit: 50 })
          .resolves(success(desOffresEmploiQueryModel()))

        // When
        const result = await getOffresEmploiQueryHandler.handle(
          getOffresEmploiQuery
        )

        // Then
        expect(result).to.deep.equal(success(desOffresEmploiQueryModel()))
      })
    })
  })

  describe('monitor', () => {
    describe("quand c'est une alternance", () => {
      it("crée un événement de recherche d'alternance", async () => {
        // Given
        const getOffresEmploiQuery: GetOffresEmploiQuery = {
          q: 'boulanger',
          departement: '75',
          alternance: true,
          experience: [Experience.entreUnEtTroisAns],
          contrat: [Contrat.cdd],
          duree: [Duree.tempsPlein]
        }

        // When
        await getOffresEmploiQueryHandler.monitor(
          unUtilisateurJeune(),
          getOffresEmploiQuery
        )

        // Then
        expect(evenementService.creerEvenement).to.have.been.calledWith(
          Evenement.Type.OFFRE_ALTERNANCE_RECHERCHEE,
          unUtilisateurJeune()
        )
      })
    })
    describe("quand c'est une offre classique", () => {
      it("crée un événement de recherche d'offre", async () => {
        // Given
        const getOffresEmploiQuery: GetOffresEmploiQuery = {
          q: 'boulanger',
          departement: '75',
          alternance: false,
          experience: [Experience.entreUnEtTroisAns],
          contrat: [Contrat.cdd],
          duree: [Duree.tempsPlein]
        }

        // When
        await getOffresEmploiQueryHandler.monitor(
          unUtilisateurJeune(),
          getOffresEmploiQuery
        )

        // Then
        expect(evenementService.creerEvenement).to.have.been.calledWith(
          Evenement.Type.OFFRE_EMPLOI_RECHERCHEE,
          unUtilisateurJeune()
        )
      })
    })
  })
})
