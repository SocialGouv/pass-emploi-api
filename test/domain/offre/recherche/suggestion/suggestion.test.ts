import { Recherche } from '../../../../../src/domain/offre/recherche/recherche'
import { expect, StubbedClass, stubClass } from '../../../../utils'
import { IdService } from '../../../../../src/utils/id-service'
import { DateService } from '../../../../../src/utils/date-service'
import { uneDatetime } from '../../../../fixtures/date.fixture'
import { uneSuggestionPE } from '../../../../fixtures/suggestion.fixture'

describe('Suggestion', () => {
  let factory: Recherche.Suggestion.Factory
  let idService: StubbedClass<IdService>
  let dateService: StubbedClass<DateService>
  const unUuid = '96b285d5-edd1-4c72-95d3-5f2e3192cd27'

  beforeEach(() => {
    idService = stubClass(IdService)
    idService.uuid.returns(unUuid)
    dateService = stubClass(DateService)
    dateService.now.returns(uneDatetime)
    factory = new Recherche.Suggestion.Factory(idService, dateService)
  })

  describe('fromPoleEmploi', () => {
    describe("quand c'est une suggestion sur un département", () => {
      it('créée la suggestion idoine', () => {
        // Given
        const suggestionPESurUnDepartement = uneSuggestionPE({
          localisation: {
            type: Recherche.Suggestion.TypeLocalisation.DEPARTEMENT,
            code: '59'
          }
        })

        // When
        const suggestion = factory.fromPoleEmploi(
          suggestionPESurUnDepartement,
          'ABCDE'
        )

        // Then
        const expected: Recherche.Suggestion = {
          criteres: {
            commune: undefined,
            departement: '59',
            q: 'Petrisseur',
            rayon: undefined
          },
          informations: {
            titre: 'Petrisseur',
            localisation: 'Lille',
            metier: 'Boulanger'
          },
          dateCreation: uneDatetime,
          dateMiseAJour: uneDatetime,
          id: '96b285d5-edd1-4c72-95d3-5f2e3192cd27',
          idFonctionnel: 'OFFRES_EMPLOI-D1104-DEPARTEMENT-59-undefined',
          idJeune: 'ABCDE',
          type: Recherche.Type.OFFRES_EMPLOI,
          source: Recherche.Suggestion.Source.POLE_EMPLOI
        }
        expect(suggestion).to.deep.equal(expected)
      })
    })
    describe("quand c'est une suggestion sur une commune", () => {
      it('créée la suggestion idoine', () => {
        // Given
        const suggestionPESurUnDepartement = uneSuggestionPE({
          localisation: {
            type: Recherche.Suggestion.TypeLocalisation.COMMUNE,
            code: '44300',
            rayon: 10
          }
        })

        // When
        const suggestion = factory.fromPoleEmploi(
          suggestionPESurUnDepartement,
          'ABCDE'
        )

        // Then
        const expected: Recherche.Suggestion = {
          criteres: {
            commune: '44300',
            departement: undefined,
            q: 'Petrisseur',
            rayon: 10
          },
          informations: {
            titre: 'Petrisseur',
            localisation: 'Lille',
            metier: 'Boulanger'
          },
          dateCreation: uneDatetime,
          dateMiseAJour: uneDatetime,
          id: '96b285d5-edd1-4c72-95d3-5f2e3192cd27',
          idFonctionnel: 'OFFRES_EMPLOI-D1104-COMMUNE-44300-10',
          idJeune: 'ABCDE',
          type: Recherche.Type.OFFRES_EMPLOI,
          source: Recherche.Suggestion.Source.POLE_EMPLOI
        }
        expect(suggestion).to.deep.equal(expected)
      })
    })
  })
})
