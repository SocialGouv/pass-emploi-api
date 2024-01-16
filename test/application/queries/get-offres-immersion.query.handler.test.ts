import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import {
  GetOffresImmersionQuery,
  GetOffresImmersionQueryHandler
} from '../../../src/application/queries/get-offres-immersion.query.handler'
import { OffreImmersionQueryModel } from '../../../src/application/queries/query-models/offres-immersion.query-model'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { FindAllOffresImmersionQueryGetter } from '../../../src/application/queries/query-getters/find-all-offres-immersion.query.getter.db'
import { success } from '../../../src/building-blocks/types/result'
import { Offre } from '../../../src/domain/offre/offre'

describe('GetOffresImmersionQueryHandler', () => {
  let findAllOffresImmersionQueryGetter: StubbedClass<FindAllOffresImmersionQueryGetter>
  let getOffresImmersionQueryHandler: GetOffresImmersionQueryHandler
  let sandbox: SinonSandbox
  let evenementService: StubbedClass<EvenementService>

  before(() => {
    sandbox = createSandbox()
    findAllOffresImmersionQueryGetter = stubClass(
      FindAllOffresImmersionQueryGetter
    )
    evenementService = stubClass(EvenementService)

    getOffresImmersionQueryHandler = new GetOffresImmersionQueryHandler(
      findAllOffresImmersionQueryGetter,
      evenementService
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    describe('quand la distance est précisée', () => {
      it('retourne des offres', async () => {
        // Given
        const getOffresImmersionQuery: GetOffresImmersionQuery = {
          rome: 'D1102',
          lat: 48.502103949334845,
          lon: 2.13082255225161,
          distance: 15
        }
        const offresImmersionQueryModel: OffreImmersionQueryModel[] = [
          {
            id: '1',
            metier: 'Boulanger',
            nomEtablissement: 'Boulangerie',
            secteurActivite: 'Restauration',
            ville: 'Paris',
            estVolontaire: false
          }
        ]
        const criteres: Offre.Recherche.Immersion = {
          rome: getOffresImmersionQuery.rome,
          lat: getOffresImmersionQuery.lat,
          lon: getOffresImmersionQuery.lon,
          distance: getOffresImmersionQuery.distance!
        }
        findAllOffresImmersionQueryGetter.handle
          .withArgs(criteres)
          .resolves(success(offresImmersionQueryModel))

        // When
        const result = await getOffresImmersionQueryHandler.handle(
          getOffresImmersionQuery
        )

        // Then
        expect(result).to.deep.equal(success(offresImmersionQueryModel))
      })
    })

    describe('quand la distance est absente', () => {
      it('retourne des offres avec la distance par défaut', async () => {
        // Given
        const getOffresImmersionQuery: GetOffresImmersionQuery = {
          rome: 'D1102',
          lat: 48.502103949334845,
          lon: 2.13082255225161
        }
        const offresImmersionQueryModel: OffreImmersionQueryModel[] = [
          {
            id: '1',
            metier: 'Boulanger',
            nomEtablissement: 'Boulangerie',
            secteurActivite: 'Restauration',
            ville: 'Paris',
            estVolontaire: true
          }
        ]
        const criteres: Offre.Recherche.Immersion = {
          rome: getOffresImmersionQuery.rome,
          lat: getOffresImmersionQuery.lat,
          lon: getOffresImmersionQuery.lon
        }
        findAllOffresImmersionQueryGetter.handle
          .withArgs(criteres)
          .resolves(success(offresImmersionQueryModel))

        // When
        const result = await getOffresImmersionQueryHandler.handle(
          getOffresImmersionQuery
        )

        // Then
        expect(result).to.deep.equal(success(offresImmersionQueryModel))
      })
    })
  })

  describe('monitor', () => {
    it("crée un événement de recherche d'offre", async () => {
      // When
      await getOffresImmersionQueryHandler.monitor(unUtilisateurJeune())

      // Then
      expect(evenementService.creer).to.have.been.calledWith(
        Evenement.Code.OFFRE_IMMERSION_RECHERCHEE,
        unUtilisateurJeune()
      )
    })
  })
})
