import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import {
  GetOffresImmersionQuery,
  GetOffresImmersionQueryHandler
} from '../../../src/application/queries/get-offres-immersion.query.handler'
import { OffreImmersionQueryModel } from '../../../src/application/queries/query-models/offres-immersion.query-model'
import { OffresImmersion } from '../../../src/domain/offre-immersion'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'

describe('GetOffresImmersionQueryHandler', () => {
  let offresImmersionRepository: StubbedType<OffresImmersion.Repository>
  let getOffresImmersionQueryHandler: GetOffresImmersionQueryHandler
  let sandbox: SinonSandbox
  let evenementService: StubbedClass<EvenementService>

  before(() => {
    sandbox = createSandbox()
    offresImmersionRepository = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)

    getOffresImmersionQueryHandler = new GetOffresImmersionQueryHandler(
      offresImmersionRepository,
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
            ville: 'Paris'
          }
        ]
        const criteres: OffresImmersion.Criteres = {
          rome: getOffresImmersionQuery.rome,
          lat: getOffresImmersionQuery.lat,
          lon: getOffresImmersionQuery.lon,
          distance: getOffresImmersionQuery.distance!
        }
        offresImmersionRepository.findAll
          .withArgs(criteres)
          .resolves(offresImmersionQueryModel)

        // When
        const result = await getOffresImmersionQueryHandler.handle(
          getOffresImmersionQuery
        )

        // Then
        expect(result).to.deep.equal(offresImmersionQueryModel)
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
            ville: 'Paris'
          }
        ]
        const criteres: OffresImmersion.Criteres = {
          rome: getOffresImmersionQuery.rome,
          lat: getOffresImmersionQuery.lat,
          lon: getOffresImmersionQuery.lon,
          distance: 10
        }
        offresImmersionRepository.findAll
          .withArgs(criteres)
          .resolves(offresImmersionQueryModel)

        // When
        const result = await getOffresImmersionQueryHandler.handle(
          getOffresImmersionQuery
        )

        // Then
        expect(result).to.deep.equal(offresImmersionQueryModel)
      })
    })
  })

  describe('monitor', () => {
    it("crée un événement de recherche d'offre", async () => {
      // When
      await getOffresImmersionQueryHandler.monitor(unUtilisateurJeune())

      // Then
      expect(evenementService.creerEvenement).to.have.been.calledWith(
        Evenement.Type.OFFRE_IMMERSION_RECHERCHEE,
        unUtilisateurJeune()
      )
    })
  })
})
