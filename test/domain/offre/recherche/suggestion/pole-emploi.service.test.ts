import { Offre } from '../../../../../src/domain/offre/offre'
import { createSandbox } from 'sinon'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { uneSuggestion } from '../../../../fixtures/suggestion.fixture'
import { expect } from '../../../../utils'
import { uneDatetime } from '../../../../fixtures/date.fixture'
import { SuggestionPoleEmploiService } from '../../../../../src/domain/offre/recherche/suggestion/pole-emploi.service'
import Recherche = Offre.Recherche

describe('PoleEmploi', () => {
  describe('Service', () => {
    let rechercheSuggestionPEService: SuggestionPoleEmploiService
    let suggestionRepository: StubbedType<Recherche.Suggestion.Repository>
    const dateMiseAJour = uneDatetime.plus({ days: 1 })

    beforeEach(() => {
      const sandbox = createSandbox()
      suggestionRepository = stubInterface(sandbox)
      rechercheSuggestionPEService = new SuggestionPoleEmploiService(
        suggestionRepository
      )
    })
    describe('rafraichir', () => {
      describe("quand il n'y a pas encore de suggestions", () => {
        it('sauvegarde les suggestions', async () => {
          // Given
          suggestionRepository.findAll.resolves([])

          // When
          await rechercheSuggestionPEService.rafraichir(
            [uneSuggestion()],
            'ABCDE'
          )

          // Then
          expect(suggestionRepository.save).to.have.been.calledOnceWithExactly(
            uneSuggestion()
          )
        })
      })

      describe('quand une suggestion avec le même id fonctionnel existe', () => {
        it('met à jour la date de mise à jour', async () => {
          // Given
          const suggestionInitiale = uneSuggestion({
            idJeune: 'ABCDE',
            idFonctionnel: 'OFFRES_EMPLOI-D1104-COMMUNE-44300-1'
          })

          suggestionRepository.findAll
            .withArgs('ABCDE')
            .resolves([suggestionInitiale])

          // When
          const nouvelleSuggestion = uneSuggestion({
            idJeune: 'ABCDE',
            idFonctionnel: 'OFFRES_EMPLOI-D1104-COMMUNE-44300-1',
            dateMiseAJour,
            criteres: {
              q: 'Les termes ont ont changé mais pas le code rome'
            }
          })
          await rechercheSuggestionPEService.rafraichir(
            [nouvelleSuggestion],
            'ABCDE'
          )

          // Then
          const suggestionMiseAJour: Recherche.Suggestion = {
            ...suggestionInitiale,
            dateMiseAJour
          }
          expect(suggestionRepository.save).to.have.been.calledOnceWithExactly(
            suggestionMiseAJour
          )
        })
      })

      describe("quand une suggestion pole emploi n'est plus présente", () => {
        it('la supprime des suggestion existantes', async () => {
          // Given
          const suggestionInitiale = uneSuggestion({
            id: '006775b1-ab1b-47b0-94f3-d1e765ed0717',
            idJeune: 'ABCDE',
            idFonctionnel: 'OFFRES_EMPLOI-D1104-COMMUNE-44300-1',
            source: Recherche.Suggestion.Source.POLE_EMPLOI
          })

          suggestionRepository.findAll
            .withArgs('ABCDE')
            .resolves([suggestionInitiale])

          // When
          const nouvelleSuggestion = uneSuggestion({
            idJeune: 'ABCDE',
            idFonctionnel: 'OFFRES_EMPLOI-D1104-COMMUNE-33100-1',
            source: Recherche.Suggestion.Source.POLE_EMPLOI
          })
          await rechercheSuggestionPEService.rafraichir(
            [nouvelleSuggestion],
            'ABCDE'
          )

          // Then
          expect(suggestionRepository.save).to.have.been.calledOnceWithExactly(
            nouvelleSuggestion
          )
          expect(
            suggestionRepository.delete
          ).to.have.been.calledOnceWithExactly(suggestionInitiale.id)
        })
      })
    })
  })
})
