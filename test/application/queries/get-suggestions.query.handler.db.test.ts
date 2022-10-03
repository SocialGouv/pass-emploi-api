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
    it("retourne les suggestions non traitées d'un jeune", async () => {
      // Given
      const suggestion = uneSuggestion()
      const suggestionAcceptee = uneSuggestion({
        id: 'f781ae20-8838-49c7-aa2e-9b224318fb66',
        dateCreationRecherche: uneDatetime
      })
      const suggestionRefusee = uneSuggestion({
        id: 'f781ae20-8838-49c7-aa2e-9b224318fb67',
        dateRefus: uneDatetime
      })

      await SuggestionSqlModel.bulkCreate([
        {
          id: suggestion.id,
          idJeune: suggestion.idJeune,
          idFonctionnel: Buffer.from(
            JSON.stringify(suggestion.idFonctionnel)
          ).toString('base64'),
          type: suggestion.type,
          source: suggestion.source,
          dateCreation: suggestion.dateCreation,
          dateRafraichissement: suggestion.dateRafraichissement,
          criteres: suggestion.criteres,
          titre: suggestion.informations.titre,
          metier: suggestion.informations.metier,
          localisation: suggestion.informations.localisation
        },
        {
          id: suggestionAcceptee.id,
          idJeune: suggestionAcceptee.idJeune,
          idFonctionnel: Buffer.from(
            JSON.stringify(suggestionAcceptee.idFonctionnel)
          ).toString('base64'),
          type: suggestionAcceptee.type,
          source: suggestionAcceptee.source,
          dateCreation: suggestionAcceptee.dateCreation,
          dateCreationRecherche: suggestionAcceptee.dateCreationRecherche,
          dateRafraichissement: suggestionAcceptee.dateRafraichissement,
          criteres: suggestionAcceptee.criteres,
          titre: suggestionAcceptee.informations.titre,
          metier: suggestionAcceptee.informations.metier,
          localisation: suggestionAcceptee.informations.localisation
        },
        {
          id: suggestionRefusee.id,
          idJeune: suggestionRefusee.idJeune,
          idFonctionnel: Buffer.from(
            JSON.stringify(suggestionRefusee.idFonctionnel)
          ).toString('base64'),
          type: suggestionRefusee.type,
          source: suggestionRefusee.source,
          dateCreation: suggestionRefusee.dateCreation,
          dateRafraichissement: suggestionRefusee.dateRafraichissement,
          dateRefus: suggestionRefusee.dateRefus,
          criteres: suggestionRefusee.criteres,
          titre: suggestionRefusee.informations.titre,
          metier: suggestionRefusee.informations.metier,
          localisation: suggestionRefusee.informations.localisation
        }
      ])

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
        dateRafraichissement: uneDatetime.toISO()
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
