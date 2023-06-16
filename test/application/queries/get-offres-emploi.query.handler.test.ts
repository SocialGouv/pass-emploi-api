import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import {
  GetOffresEmploiQuery,
  GetOffresEmploiQueryHandler
} from '../../../src/application/queries/get-offres-emploi.query.handler'
import { desOffresEmploiQueryModel } from '../../fixtures/query-models/offre-emploi.query-model.fixtures'
import { success } from '../../../src/building-blocks/types/result'
import { FindAllOffresEmploiQueryGetter } from '../../../src/application/queries/query-getters/find-all-offres-emploi.query.getter'
import { Offre } from '../../../src/domain/offre/offre'

describe('GetOffresEmploiQueryHandler', () => {
  let findAllOffresEmploi: StubbedClass<FindAllOffresEmploiQueryGetter>
  let getOffresEmploiQueryHandler: GetOffresEmploiQueryHandler
  let sandbox: SinonSandbox
  let evenementService: StubbedClass<EvenementService>

  before(() => {
    sandbox = createSandbox()
    findAllOffresEmploi = stubClass(FindAllOffresEmploiQueryGetter)
    evenementService = stubClass(EvenementService)

    getOffresEmploiQueryHandler = new GetOffresEmploiQueryHandler(
      findAllOffresEmploi,
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
          experience: [Offre.Emploi.Experience.entreUnEtTroisAns],
          debutantAccepte: false,
          contrat: [Offre.Emploi.Contrat.cdd],
          duree: [Offre.Emploi.Duree.tempsPlein]
        }

        findAllOffresEmploi.handle
          .withArgs({ ...getOffresEmploiQuery, page: 2, limit: 52 })
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
          experience: [Offre.Emploi.Experience.entreUnEtTroisAns],
          debutantAccepte: false,
          contrat: [Offre.Emploi.Contrat.cdd],
          duree: [Offre.Emploi.Duree.tempsPlein]
        }

        findAllOffresEmploi.handle
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
  })

  describe('monitor', () => {
    describe("quand c'est une alternance", () => {
      it("crée un événement de recherche d'alternance", async () => {
        // Given
        const getOffresEmploiQuery: GetOffresEmploiQuery = {
          q: 'boulanger',
          departement: '75',
          alternance: true,
          experience: [Offre.Emploi.Experience.entreUnEtTroisAns],
          contrat: [Offre.Emploi.Contrat.cdd],
          duree: [Offre.Emploi.Duree.tempsPlein]
        }

        // When
        await getOffresEmploiQueryHandler.monitor(
          unUtilisateurJeune(),
          getOffresEmploiQuery
        )

        // Then
        expect(evenementService.creer).to.have.been.calledWith(
          Evenement.Code.OFFRE_ALTERNANCE_RECHERCHEE,
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
          experience: [Offre.Emploi.Experience.entreUnEtTroisAns],
          contrat: [Offre.Emploi.Contrat.cdd],
          duree: [Offre.Emploi.Duree.tempsPlein]
        }

        // When
        await getOffresEmploiQueryHandler.monitor(
          unUtilisateurJeune(),
          getOffresEmploiQuery
        )

        // Then
        expect(evenementService.creer).to.have.been.calledWith(
          Evenement.Code.OFFRE_EMPLOI_RECHERCHEE,
          unUtilisateurJeune()
        )
      })
    })
  })
})
