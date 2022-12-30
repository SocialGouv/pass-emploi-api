import { Offre } from '../../../../../../src/domain/offre/offre'
import { SuggestionSqlRepository } from '../../../../../../src/infrastructure/repositories/offre/recherche/suggestion/suggestion-sql.repository.db'
import { ConseillerSqlModel } from '../../../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { SuggestionSqlModel } from '../../../../../../src/infrastructure/sequelize/models/suggestion.sql-model'
import { uneDatetime } from '../../../../../fixtures/date.fixture'
import { Recherche } from '../../../../../../src/domain/offre/recherche/recherche'
import { Suggestion } from '../../../../../../src/domain/offre/recherche/suggestion/suggestion'
import { unConseillerDto } from '../../../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../../../fixtures/sql-models/jeune.sql-model'
import { expect } from '../../../../../utils'
import { getDatabase } from '../../../../../utils/database-for-testing'

describe('SuggestionSqlRepository', () => {
  let suggestionSqlRepository: SuggestionSqlRepository
  const suggestion: Offre.Recherche.Suggestion = {
    dateCreation: uneDatetime(),
    dateRafraichissement: uneDatetime(),
    dateCreationRecherche: undefined,
    dateRefus: undefined,
    id: 'f781ae20-8838-49c7-aa2e-9b224318fb65',
    idFonctionnel: {
      typeRecherche: Recherche.Type.OFFRES_EMPLOI,
      typeLocalisation: Suggestion.TypeLocalisation.COMMUNE,
      codeLocalisation: '59220',
      rayon: Recherche.DISTANCE_PAR_DEFAUT,
      codeRome: 'D1104'
    },
    idJeune: 'ABCDE',
    type: Offre.Recherche.Type.OFFRES_EMPLOI,
    source: Offre.Recherche.Suggestion.Source.POLE_EMPLOI,
    informations: {
      titre: 'Petrisseur',
      localisation: 'Lille',
      metier: 'Boulanger'
    },
    idRecherche: undefined,
    criteres: {
      q: 'Petrisseur',
      commune: '59220',
      rayon: 10,
      minDateCreation: uneDatetime().toISO()
    }
  }

  const jeuneDto = unJeuneDto()

  beforeEach(async () => {
    await getDatabase().cleanPG()
    await ConseillerSqlModel.creer(unConseillerDto())
    await JeuneSqlModel.creer(jeuneDto)

    suggestionSqlRepository = new SuggestionSqlRepository()
  })

  describe('save', () => {
    it('sauvegarde une suggestion', async () => {
      // When
      await suggestionSqlRepository.save(suggestion)

      // Then
      const suggestions = await SuggestionSqlModel.findAll()
      expect(suggestions).to.have.length(1)
      expect(suggestions[0].id).to.equal(suggestion.id)
    })
  })

  describe('findAll', () => {
    it("retourne les suggestions d'un jeune", async () => {
      // Given
      await suggestionSqlRepository.save(suggestion)

      // When
      const suggestions = await suggestionSqlRepository.findAll(jeuneDto.id)

      // Then
      expect(suggestions).to.deep.equal([suggestion])
    })
  })

  describe('get', () => {
    it('retourne la suggestion du jeune', async () => {
      // Given
      await suggestionSqlRepository.save(suggestion)

      // When
      const suggestionTrouvee = await suggestionSqlRepository.get(suggestion.id)

      // Then
      expect(suggestionTrouvee).to.deep.equal(suggestion)
    })
  })

  describe('delete', () => {
    it('supprime une suggestion', async () => {
      // Given
      await suggestionSqlRepository.save(suggestion)

      // When
      await suggestionSqlRepository.delete(suggestion.id)

      // Then
      const suggestions = await suggestionSqlRepository.findAll(jeuneDto.id)
      expect(suggestions).to.have.length(0)
    })
  })
})
