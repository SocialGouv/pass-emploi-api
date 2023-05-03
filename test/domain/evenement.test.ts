import { Evenement, EvenementService } from '../../src/domain/evenement'
import { DateService } from '../../src/utils/date-service'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { expect, StubbedClass, stubClass } from '../utils'
import { uneDate, uneDatetime } from '../fixtures/date.fixture'
import { unUtilisateurJeune } from '../fixtures/authentification.fixture'
import { createSandbox } from 'sinon'
import { Recherche } from '../../src/domain/offre/recherche/recherche'
import Suggestion = Recherche.Suggestion
import { uneSuggestion } from '../fixtures/suggestion.fixture'

describe('Evenements', () => {
  let evenementService: EvenementService
  let evenementRepository: StubbedType<Evenement.Repository>
  let suggestionRepository: StubbedType<Suggestion.Repository>
  let dateService: StubbedClass<DateService>

  beforeEach(() => {
    const sandbox = createSandbox()
    evenementRepository = stubInterface(sandbox)
    suggestionRepository = stubInterface(sandbox)
    dateService = stubClass(DateService)
    evenementService = new EvenementService(
      evenementRepository,
      dateService,
      suggestionRepository
    )
  })

  describe('creer', () => {
    it('sauvegarde un événement avec les bons attributs', () => {
      // Given
      dateService.nowJs.returns(uneDate())
      const utilisateur = unUtilisateurJeune()

      // When
      evenementService.creer(Evenement.Code.ACTION_STATUT_MODIFIE, utilisateur)

      // Then
      const evenement: Evenement = {
        categorie: 'Action',
        action: 'Modification',
        nom: 'Statut',
        date: uneDate(),
        code: Evenement.Code.ACTION_STATUT_MODIFIE,
        utilisateur
      }
      expect(evenementRepository.save).to.have.been.calledWithExactly(evenement)
    })
  })

  describe('creerEvenementSugggestion', () => {
    describe('quand la suggestion est traitée', () => {
      it('crée un évènement avec la source de la suggestion ajoutée aux libellés', async () => {
        // Given
        dateService.nowJs.returns(uneDate())
        const utilisateur = unUtilisateurJeune()

        const idSuggestion = 'f781ae20-8838-49c7-aa2e-9b224318fb65'
        const suggestionAlternanceConseillerRefusee = uneSuggestion({
          id: idSuggestion,
          source: Suggestion.Source.CONSEILLER,
          type: Recherche.Type.OFFRES_ALTERNANCE,
          dateRefus: uneDatetime()
        })

        suggestionRepository.get
          .withArgs(idSuggestion)
          .resolves(suggestionAlternanceConseillerRefusee)

        // When
        await evenementService.creerEvenementSuggestion(
          utilisateur,
          idSuggestion
        )

        // Then
        const evenement: Evenement = {
          categorie: 'Suggestion',
          action: 'Refuser - Conseiller',
          nom: 'Alternance',
          date: uneDate(),
          code: Evenement.Code.SUGGESTION_ALTERNANCE_CONSEILLER_REFUSEE,
          utilisateur
        }
        expect(evenementRepository.save).to.have.been.calledWithExactly(
          evenement
        )
      })
    })
  })
})
