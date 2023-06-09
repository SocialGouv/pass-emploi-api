import { Recherche } from '../../../../../src/domain/offre/recherche/recherche'
import { expect, StubbedClass, stubClass } from '../../../../utils'
import { IdService } from '../../../../../src/utils/id-service'
import { DateService } from '../../../../../src/utils/date-service'
import { uneDatetime } from '../../../../fixtures/date.fixture'
import {
  uneSuggestion,
  uneSuggestionPE
} from '../../../../fixtures/suggestion.fixture'
import { Suggestion } from 'src/domain/offre/recherche/suggestion/suggestion'
import {
  failure,
  success
} from '../../../../../src/building-blocks/types/result'
import { describe } from 'mocha'
import { DateTime } from 'luxon'
import { MauvaiseCommandeError } from '../../../../../src/building-blocks/types/domain-error'
import { Core } from '../../../../../src/domain/core'
import { Offre } from 'src/domain/offre/offre'

describe('Suggestion', () => {
  let factory: Recherche.Suggestion.Factory
  let idService: StubbedClass<IdService>
  let dateService: StubbedClass<DateService>
  const unUuid = '96b285d5-edd1-4c72-95d3-5f2e3192cd27'
  const maintenant = uneDatetime()

  beforeEach(() => {
    idService = stubClass(IdService)
    idService.uuid.returns(unUuid)
    dateService = stubClass(DateService)
    dateService.now.returns(maintenant)
    factory = new Recherche.Suggestion.Factory(idService, dateService)
  })

  describe('buildListeSuggestionsOffresFromPoleEmploi', () => {
    describe("quand c'est une suggestion sur un département avec métier", () => {
      it("crée la suggestion d'offre d'emploi", () => {
        // Given
        const suggestionPESurUnDepartement = uneSuggestionPE({
          localisation: {
            libelle: 'test',
            type: Recherche.Suggestion.TypeLocalisation.DEPARTEMENT,
            code: '59'
          }
        })

        // When
        const suggestion = factory.buildListeSuggestionsOffresFromPoleEmploi(
          [suggestionPESurUnDepartement],
          'ABCDE',
          Core.Structure.MILO
        )

        // Then
        const expected: Recherche.Suggestion[] = [
          {
            criteres: {
              commune: undefined,
              departement: '59',
              q: 'Petrisseur',
              rayon: 10
            },
            informations: {
              titre: 'Petrisseur',
              localisation: 'test',
              metier: 'Boulanger'
            },
            dateCreation: uneDatetime(),
            dateRafraichissement: uneDatetime(),
            id: '96b285d5-edd1-4c72-95d3-5f2e3192cd27',
            idFonctionnel: {
              typeRecherche: Recherche.Type.OFFRES_EMPLOI,
              typeLocalisation: suggestionPESurUnDepartement.localisation.type,
              codeLocalisation: suggestionPESurUnDepartement.localisation.code,
              rayon: Recherche.DISTANCE_PAR_DEFAUT,
              codeRome: suggestionPESurUnDepartement.codeRome!
            },
            idJeune: 'ABCDE',
            type: Recherche.Type.OFFRES_EMPLOI,
            source: Recherche.Suggestion.Source.POLE_EMPLOI
          }
        ]
        expect(suggestion).to.deep.equal(expected)
      })
    })
    describe("quand c'est une suggestion sur une commune avec métier", () => {
      it("crée la suggestion offre d'emploi, immersion et service civique", () => {
        // Given
        const suggestionPESurUneCommune = uneSuggestionPE()

        // When
        const suggestion = factory.buildListeSuggestionsOffresFromPoleEmploi(
          [suggestionPESurUneCommune],
          'ABCDE',
          Core.Structure.MILO
        )

        // Then
        const expected: Recherche.Suggestion[] = [
          {
            criteres: {
              commune: '59220',
              departement: undefined,
              q: 'Petrisseur',
              rayon: 10
            },
            informations: {
              titre: 'Petrisseur',
              localisation: 'test',
              metier: 'Boulanger'
            },
            dateCreation: uneDatetime(),
            dateRafraichissement: uneDatetime(),
            id: '96b285d5-edd1-4c72-95d3-5f2e3192cd27',
            idFonctionnel: {
              typeRecherche: Recherche.Type.OFFRES_EMPLOI,
              typeLocalisation: suggestionPESurUneCommune.localisation.type,
              codeLocalisation: suggestionPESurUneCommune.localisation.code,
              rayon: Recherche.DISTANCE_PAR_DEFAUT,
              codeRome: suggestionPESurUneCommune.codeRome!
            },
            idJeune: 'ABCDE',
            type: Recherche.Type.OFFRES_EMPLOI,
            source: Recherche.Suggestion.Source.POLE_EMPLOI
          },
          {
            criteres: {
              lat: 1,
              lon: 1,
              distance: 10,
              rome: 'D1104'
            },
            informations: {
              titre: 'Petrisseur',
              localisation: 'test',
              metier: 'Boulanger'
            },
            dateCreation: uneDatetime(),
            dateRafraichissement: uneDatetime(),
            id: '96b285d5-edd1-4c72-95d3-5f2e3192cd27',
            idFonctionnel: {
              typeRecherche: Recherche.Type.OFFRES_IMMERSION,
              typeLocalisation: suggestionPESurUneCommune.localisation.type,
              codeLocalisation: suggestionPESurUneCommune.localisation.code,
              rayon: Recherche.DISTANCE_PAR_DEFAUT,
              codeRome: suggestionPESurUneCommune.codeRome!
            },
            idJeune: 'ABCDE',
            type: Recherche.Type.OFFRES_IMMERSION,
            source: Recherche.Suggestion.Source.POLE_EMPLOI
          },
          {
            criteres: {
              lat: 1,
              lon: 1,
              distance: 10,
              domaine: 'Boulanger'
            },
            informations: {
              titre: 'Petrisseur',
              localisation: 'test',
              metier: 'Boulanger'
            },
            dateCreation: uneDatetime(),
            dateRafraichissement: uneDatetime(),
            id: '96b285d5-edd1-4c72-95d3-5f2e3192cd27',
            idFonctionnel: {
              typeRecherche: Recherche.Type.OFFRES_SERVICES_CIVIQUE,
              typeLocalisation: suggestionPESurUneCommune.localisation.type,
              codeLocalisation: suggestionPESurUneCommune.localisation.code,
              rayon: Recherche.DISTANCE_PAR_DEFAUT,
              codeRome: null
            },
            idJeune: 'ABCDE',
            type: Recherche.Type.OFFRES_SERVICES_CIVIQUE,
            source: Recherche.Suggestion.Source.POLE_EMPLOI
          }
        ]
        expect(suggestion).to.deep.equal(expected)
      })
      it("crée les suggestions offre d'emploi, immersion sauf service civique quand le jeune est BRSA", () => {
        // Given
        const suggestionPESurUneCommune = uneSuggestionPE()

        // When
        const suggestion = factory.buildListeSuggestionsOffresFromPoleEmploi(
          [suggestionPESurUneCommune],
          'ABCDE',
          Core.Structure.POLE_EMPLOI_BRSA
        )

        // Then
        const expected: Recherche.Suggestion[] = [
          {
            criteres: {
              commune: '59220',
              departement: undefined,
              q: 'Petrisseur',
              rayon: 10
            },
            informations: {
              titre: 'Petrisseur',
              localisation: 'test',
              metier: 'Boulanger'
            },
            dateCreation: uneDatetime(),
            dateRafraichissement: uneDatetime(),
            id: '96b285d5-edd1-4c72-95d3-5f2e3192cd27',
            idFonctionnel: {
              typeRecherche: Recherche.Type.OFFRES_EMPLOI,
              typeLocalisation: suggestionPESurUneCommune.localisation.type,
              codeLocalisation: suggestionPESurUneCommune.localisation.code,
              rayon: Recherche.DISTANCE_PAR_DEFAUT,
              codeRome: suggestionPESurUneCommune.codeRome!
            },
            idJeune: 'ABCDE',
            type: Recherche.Type.OFFRES_EMPLOI,
            source: Recherche.Suggestion.Source.POLE_EMPLOI
          },
          {
            criteres: {
              lat: 1,
              lon: 1,
              distance: 10,
              rome: 'D1104'
            },
            informations: {
              titre: 'Petrisseur',
              localisation: 'test',
              metier: 'Boulanger'
            },
            dateCreation: uneDatetime(),
            dateRafraichissement: uneDatetime(),
            id: '96b285d5-edd1-4c72-95d3-5f2e3192cd27',
            idFonctionnel: {
              typeRecherche: Recherche.Type.OFFRES_IMMERSION,
              typeLocalisation: suggestionPESurUneCommune.localisation.type,
              codeLocalisation: suggestionPESurUneCommune.localisation.code,
              rayon: Recherche.DISTANCE_PAR_DEFAUT,
              codeRome: suggestionPESurUneCommune.codeRome!
            },
            idJeune: 'ABCDE',
            type: Recherche.Type.OFFRES_IMMERSION,
            source: Recherche.Suggestion.Source.POLE_EMPLOI
          }
        ]
        expect(suggestion).to.deep.equal(expected)
      })
    })
    describe("quand c'est une suggestion sur une commune sans métier", () => {
      it('crée la suggestion service civique', () => {
        // Given
        const suggestionPESurUneCommune = uneSuggestionPE({
          codeRome: undefined,
          titreMetier: undefined,
          categorieMetier: undefined
        })

        // When
        const suggestion = factory.buildListeSuggestionsOffresFromPoleEmploi(
          [suggestionPESurUneCommune],
          'ABCDE',
          Core.Structure.MILO
        )

        // Then
        const expected: Recherche.Suggestion[] = [
          {
            criteres: {
              lat: 1,
              lon: 1,
              distance: 10,
              domaine: undefined
            },
            informations: {
              titre: 'Recherche de service civique à test',
              localisation: 'test',
              metier: 'Service civique à test'
            },
            dateCreation: uneDatetime(),
            dateRafraichissement: uneDatetime(),
            id: '96b285d5-edd1-4c72-95d3-5f2e3192cd27',
            idFonctionnel: {
              typeRecherche: Recherche.Type.OFFRES_SERVICES_CIVIQUE,
              typeLocalisation: suggestionPESurUneCommune.localisation.type,
              codeLocalisation: suggestionPESurUneCommune.localisation.code,
              rayon: Recherche.DISTANCE_PAR_DEFAUT,
              codeRome: null
            },
            idJeune: 'ABCDE',
            type: Recherche.Type.OFFRES_SERVICES_CIVIQUE,
            source: Recherche.Suggestion.Source.POLE_EMPLOI
          }
        ]
        expect(suggestion).to.deep.equal(expected)
      })
    })
    describe("quand c'est une suggestion sur une commune sans coordonnees", () => {
      it('ne crée pas la suggestion immersion et service civique', () => {
        // Given
        const suggestionPESurUneCommune = uneSuggestionPE({
          localisation: {
            libelle: 'test',
            code: '59220',
            type: Recherche.Suggestion.TypeLocalisation.COMMUNE
          }
        })

        // When
        const suggestion = factory.buildListeSuggestionsOffresFromPoleEmploi(
          [suggestionPESurUneCommune],
          'ABCDE',
          Core.Structure.MILO
        )

        // Then
        const expected: Recherche.Suggestion[] = [
          {
            criteres: {
              commune: '59220',
              departement: undefined,
              q: 'Petrisseur',
              rayon: 10
            },
            informations: {
              titre: 'Petrisseur',
              localisation: 'test',
              metier: 'Boulanger'
            },
            dateCreation: uneDatetime(),
            dateRafraichissement: uneDatetime(),
            id: '96b285d5-edd1-4c72-95d3-5f2e3192cd27',
            idFonctionnel: {
              typeRecherche: Recherche.Type.OFFRES_EMPLOI,
              typeLocalisation: suggestionPESurUneCommune.localisation.type,
              codeLocalisation: suggestionPESurUneCommune.localisation.code,
              rayon: Recherche.DISTANCE_PAR_DEFAUT,
              codeRome: suggestionPESurUneCommune.codeRome!
            },
            idJeune: 'ABCDE',
            type: Recherche.Type.OFFRES_EMPLOI,
            source: Recherche.Suggestion.Source.POLE_EMPLOI
          }
        ]
        expect(suggestion).to.deep.equal(expected)
      })
    })
  })

  describe('sontEquivalentes', () => {
    it('retourne vrai quand les champs ont les mêmes valeurs', () => {
      // Given
      const suggestion1 = uneSuggestion()
      const suggestion2 = uneSuggestion()

      // When
      const equivalentes = Suggestion.sontEquivalentes(suggestion1, suggestion2)

      // Then
      expect(equivalentes).to.be.true()
    })

    it('retourne faux quand un des champs est différent', () => {
      // Given
      const suggestion1 = uneSuggestion({
        idFonctionnel: {
          typeRecherche: Recherche.Type.OFFRES_EMPLOI,
          typeLocalisation: Suggestion.TypeLocalisation.COMMUNE,
          codeLocalisation: '59220',
          rayon: Recherche.DISTANCE_PAR_DEFAUT,
          codeRome: 'D1104'
        }
      })
      const suggestion2 = uneSuggestion({
        idFonctionnel: {
          typeRecherche: Recherche.Type.OFFRES_SERVICES_CIVIQUE,
          typeLocalisation: Suggestion.TypeLocalisation.COMMUNE,
          codeLocalisation: '59220',
          rayon: Recherche.DISTANCE_PAR_DEFAUT,
          codeRome: null
        }
      })

      // When
      const equivalentes = Suggestion.sontEquivalentes(suggestion1, suggestion2)

      // Then
      expect(equivalentes).to.be.false()
    })
  })

  describe('construireCriteresSuggestionsDiagoriente', () => {
    it('retourne un critère de type OFFRE IMMERSION"', () => {
      const suggestion = uneSuggestion({
        source: Suggestion.Source.DIAGORIENTE,
        type: Offre.Recherche.Type.OFFRES_IMMERSION
      })
      const locationDiagoriente = {
        location: {
          type: Suggestion.TypeLocalisation.DEPARTEMENT,
          latitude: 10,
          longitude: 5,
          code: '75012'
        }
      }
      const criteres = factory.construireCriteresSuggestionsDiagoriente(
        suggestion,
        locationDiagoriente
      )
      expect(criteres).to.deep.equal({
        rome: suggestion.idFonctionnel!.codeRome!,
        lat: locationDiagoriente.location.latitude,
        lon: locationDiagoriente.location.longitude,
        distance: Recherche.DISTANCE_PAR_DEFAUT
      })
    })
    it('retourne un critère de type OFFRE EMPLOI"', () => {
      const suggestion = uneSuggestion({
        source: Suggestion.Source.DIAGORIENTE,
        type: Offre.Recherche.Type.OFFRES_EMPLOI
      })
      const locationDiagoriente = {
        location: {
          type: Suggestion.TypeLocalisation.COMMUNE,
          latitude: 10,
          longitude: 5,
          code: '75012'
        },
        rayon: 15
      }
      const criteres = factory.construireCriteresSuggestionsDiagoriente(
        suggestion,
        locationDiagoriente
      )
      expect(criteres).to.deep.equal({
        commune: '75012',
        rayon: 15,
        departement: undefined
      })
    })
  })

  describe('accepter', () => {
    describe('quand la suggestion est déjà traitée', () => {
      it('retourne une failure "Suggestion déjà traitée"', () => {
        const suggestion = uneSuggestion({
          dateRefus: DateTime.fromISO('2022-10-03T15:30:00Z')
        })
        const acceptee = factory.accepter(suggestion)
        expect(acceptee).to.deep.equal(
          failure(new MauvaiseCommandeError('Suggestion déjà traitée'))
        )
      })
    })
    describe('quand la suggestion n’est pas déjà traitée', () => {
      it('retourne une suggestion acceptée', () => {
        const suggestion = uneSuggestion()
        const acceptee = factory.accepter(suggestion)
        expect(acceptee).to.deep.equal(
          success({
            ...suggestion,
            dateCreationRecherche: uneDatetime(),
            idRecherche: unUuid
          })
        )
      })
    })
  })

  describe('refuser', () => {
    describe('quand la suggestion est déjà traitée', () => {
      it('retourne une failure "Suggestion déjà traitée"', () => {
        const suggestion = uneSuggestion({
          dateRefus: DateTime.fromISO('2022-10-03T15:30:00Z')
        })
        const refusee = factory.refuser(suggestion)
        expect(refusee).to.deep.equal(
          failure(new MauvaiseCommandeError('Suggestion déjà traitée'))
        )
      })
    })
    describe('quand la suggestion n’est pas déjà traitée', () => {
      it('retourne une suggestion refusée', () => {
        const suggestion = uneSuggestion()
        const refusee = factory.refuser(suggestion)
        expect(refusee).to.deep.equal(
          success({
            ...suggestion,
            dateRefus: uneDatetime()
          })
        )
      })
    })
  })

  describe('creerSuggestionConseiller', () => {
    const idJeune = '1'
    const localisation = 'Paris'
    it('retourne une suggestion offre emploi', () => {
      // Given
      const criteres = {
        commune: '00'
      }

      const expectedSuggestion: Suggestion = {
        id: unUuid,
        idFonctionnel: undefined,
        idJeune,
        dateCreation: maintenant,
        dateRafraichissement: maintenant,
        type: Recherche.Type.OFFRES_EMPLOI,
        source: Suggestion.Source.CONSEILLER,
        informations: {
          titre: "Recherche d'offre d'emploi à Paris",
          metier: "Recherche d'offre d'emploi",
          localisation
        },
        criteres
      }

      // When
      const suggestion = factory.creerSuggestionConseiller(
        Recherche.Type.OFFRES_EMPLOI,
        idJeune,
        criteres,
        localisation
      )

      // Then
      expect(suggestion).to.deep.equal(expectedSuggestion)
    })
    it('retourne une suggestion offre emploi avec q comme metier', () => {
      // Given
      const criteres = {
        q: 'boulanger',
        commune: '00'
      }

      const expectedSuggestion: Suggestion = {
        id: unUuid,
        idFonctionnel: undefined,
        idJeune,
        dateCreation: maintenant,
        dateRafraichissement: maintenant,
        type: Recherche.Type.OFFRES_EMPLOI,
        source: Suggestion.Source.CONSEILLER,
        informations: {
          titre: 'boulanger à Paris',
          metier: 'boulanger',
          localisation
        },
        criteres
      }

      // When
      const suggestion = factory.creerSuggestionConseiller(
        Recherche.Type.OFFRES_EMPLOI,
        idJeune,
        criteres,
        localisation
      )

      // Then
      expect(suggestion).to.deep.equal(expectedSuggestion)
    })
    it('retourne une suggestion immersion avec un titre', () => {
      // Given
      const criteres: Recherche.Immersion = {
        rome: 'D900i',
        lat: 10,
        lon: 10
      }

      const expectedSuggestion: Suggestion = {
        id: unUuid,
        idFonctionnel: undefined,
        idJeune,
        dateCreation: maintenant,
        dateRafraichissement: maintenant,
        type: Recherche.Type.OFFRES_IMMERSION,
        source: Suggestion.Source.CONSEILLER,
        informations: {
          titre: 'boulanger à Paris',
          metier: 'boulanger',
          localisation
        },
        criteres
      }

      // When
      const suggestion = factory.creerSuggestionConseiller(
        Recherche.Type.OFFRES_IMMERSION,
        idJeune,
        criteres,
        localisation,
        undefined,
        'boulanger'
      )

      // Then
      expect(suggestion).to.deep.equal(expectedSuggestion)
    })
    it('retourne une suggestion service civique', () => {
      // Given
      const criteres: Recherche.ServiceCivique = {
        lat: 10,
        lon: 10
      }

      const expectedSuggestion: Suggestion = {
        id: unUuid,
        idFonctionnel: undefined,
        idJeune,
        dateCreation: maintenant,
        dateRafraichissement: maintenant,
        type: Recherche.Type.OFFRES_SERVICES_CIVIQUE,
        source: Suggestion.Source.CONSEILLER,
        informations: {
          titre: 'Recherche de service civique à Paris',
          metier: 'Recherche de service civique',
          localisation
        },
        criteres
      }

      // When
      const suggestion = factory.creerSuggestionConseiller(
        Recherche.Type.OFFRES_SERVICES_CIVIQUE,
        idJeune,
        criteres,
        localisation
      )

      // Then
      expect(suggestion).to.deep.equal(expectedSuggestion)
    })
  })
})
