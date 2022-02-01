import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import {
  GetRecherchesQuery,
  GetRecherchesQueryHandler
} from '../../../src/application/queries/get-recherches.query.handler'
import { Recherche } from '../../../src/domain/recherche'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { RechercheQueryModel } from '../../../src/application/queries/query-models/recherches.query-model'
import { Contrat, Duree, Experience } from '../../../src/domain/offre-emploi'

describe('GetRecherchesQueryHandler', () => {
  let recherchesRepository: StubbedType<Recherche.Repository>
  let getRecherchesQueryHandler: GetRecherchesQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>

  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    recherchesRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    getRecherchesQueryHandler = new GetRecherchesQueryHandler(
      recherchesRepository,
      jeuneAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('retourne des recherches', async () => {
      // Given
      const getRecherchesQuery: GetRecherchesQuery = {
        idJeune: '1'
      }
      const recherchesQueryModel: RechercheQueryModel[] = [
        {
          id: '1',
          metier: 'Boulanger',
          localisation: '',
          titre: 'titre',
          type: 'OFFRES_EMPLOI',
          criteres: {
            page: 1,
            limit: 50,
            q: 'informatique',
            departement: undefined,
            alternance: true,
            experience: [Experience.moinsdUnAn],
            contrat: [Contrat.cdi, Contrat.cdd],
            duree: [Duree.tempsPartiel],
            rayon: 0,
            commune: '75118'
          }
        }
      ]
      recherchesRepository.getRecherches
        .withArgs(getRecherchesQuery.idJeune)
        .resolves(recherchesQueryModel)

      // When
      const result = await getRecherchesQueryHandler.handle(getRecherchesQuery)

      // Then
      expect(result).to.deep.equal(recherchesQueryModel)
    })
  })
})
