import { DatabaseForTesting } from '../../utils/database-for-testing'
import { GetSuggestionsQueryHandler } from '../../../src/application/queries/get-suggestions.query.handler.db'
import { expect, StubbedClass, stubClass } from '../../utils'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { SuggestionSqlModel } from '../../../src/infrastructure/sequelize/models/suggestion.sql-model'
import { uneSuggestion } from '../../fixtures/suggestion.fixture'
import { SuggestionQueryModel } from '../../../src/application/queries/query-models/suggestion.query-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { Offre } from '../../../src/domain/offre/offre'
import { uneDatetime } from '../../fixtures/date.fixture'

describe('GetSuggestionsQueryHandler', () => {
  DatabaseForTesting.prepare()
  let queryHandler: GetSuggestionsQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>

  beforeEach(async () => {
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    queryHandler = new GetSuggestionsQueryHandler(jeuneAuthorizer)

    await ConseillerSqlModel.creer(unConseillerDto())
    await JeuneSqlModel.creer(unJeuneDto())
  })

  describe('handle', () => {
    it("retourne les suggestions d'un jeune", async () => {
      // Given
      const suggestion = uneSuggestion()
      await SuggestionSqlModel.create({
        id: suggestion.id,
        idJeune: suggestion.idJeune,
        idFonctionnel: suggestion.idFonctionnel,
        type: suggestion.type,
        source: suggestion.source,
        dateCreation: suggestion.dateCreation,
        dateMiseAJour: suggestion.dateMiseAJour,
        criteres: suggestion.criteres,
        titre: suggestion.informations.titre,
        metier: suggestion.informations.metier,
        localisation: suggestion.informations.localisation
      })

      // When
      const suggestions = await queryHandler.handle({
        idJeune: suggestion.idJeune
      })

      // Then
      const queryModel: SuggestionQueryModel = {
        id: 'f781ae20-8838-49c7-aa2e-9b224318fb65',
        titre: 'Petrisseur',
        type: Offre.Recherche.Type.OFFRES_EMPLOI,
        metier: 'Boulanger',
        localisation: 'Lille',
        dateCreation: uneDatetime.toISO(),
        dateMiseAJour: uneDatetime.toISO()
      }
      expect(suggestions).to.deep.equal([queryModel])
    })
  })

  describe('authorize', () => {
    it('autorise un jeune', async () => {
      // When
      await queryHandler.authorize({ idJeune: 'idJeune' }, unUtilisateurJeune())

      // Then
      expect(jeuneAuthorizer.authorize).to.have.been.calledWithExactly(
        'idJeune',
        unUtilisateurJeune()
      )
    })
  })
})
