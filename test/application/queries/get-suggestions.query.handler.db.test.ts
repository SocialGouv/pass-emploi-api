import { GetSuggestionsQueryHandler } from '../../../src/application/queries/get-suggestions.query.handler.db'
import { expect, StubbedClass, stubClass } from '../../utils'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
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
import { getDatabase } from '../../utils/database-for-testing'
import { Suggestion } from 'src/domain/offre/recherche/suggestion/suggestion'

describe('GetSuggestionsQueryHandler', () => {
  let queryHandler: GetSuggestionsQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>

  beforeEach(async () => {
    await getDatabase().cleanPG()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    queryHandler = new GetSuggestionsQueryHandler(jeuneAuthorizer)

    await ConseillerSqlModel.creer(unConseillerDto())
    await JeuneSqlModel.creer(unJeuneDto())
  })

  describe('handle', () => {
    it('retourne toutes les suggestions quand avecDiagoriente est true', async () => {
      // Given

      const suggestion = uneSuggestion()
      const suggestionDiagoriente = uneSuggestion({
        id: 'abc1ae20-8838-a9c7-aa2e-ab2243a8fb6a',
        source: Suggestion.Source.DIAGORIENTE,
        informations: {
          titre: 'Petrisseur'
        }
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
          id: suggestionDiagoriente.id,
          idJeune: suggestionDiagoriente.idJeune,
          idFonctionnel: Buffer.from(
            JSON.stringify(suggestionDiagoriente.idFonctionnel)
          ).toString('base64'),
          type: suggestionDiagoriente.type,
          source: suggestionDiagoriente.source,
          dateCreation: suggestionDiagoriente.dateCreation,
          dateRafraichissement: suggestionDiagoriente.dateRafraichissement,
          titre: suggestionDiagoriente.informations.titre
        }
      ])

      // When
      const suggestions = await queryHandler.handle({
        idJeune: suggestion.idJeune,
        avecDiagoriente: true
      })

      const queryModel: SuggestionQueryModel[] = [
        {
          id: suggestion.id,
          titre: 'Petrisseur',
          type: Offre.Recherche.Type.OFFRES_EMPLOI,
          source: suggestion.source,
          metier: 'Boulanger',
          localisation: 'Lille',
          dateCreation: uneDatetime().toISO(),
          dateRafraichissement: uneDatetime().toISO()
        },
        {
          id: suggestionDiagoriente.id,
          titre: 'Petrisseur',
          type: Offre.Recherche.Type.OFFRES_EMPLOI,
          source: suggestionDiagoriente.source,
          dateCreation: uneDatetime().toISO(),
          dateRafraichissement: uneDatetime().toISO(),
          metier: undefined,
          localisation: undefined
        }
      ]

      // Then

      expect(suggestions).to.deep.equal(queryModel)
    })
    it("retourne les suggestions non traitées d'un jeune", async () => {
      // Given

      const suggestion = uneSuggestion()
      const suggestionAcceptee = uneSuggestion({
        id: 'f781ae20-8838-49c7-aa2e-9b224318fb66',
        dateCreationRecherche: uneDatetime()
      })
      const suggestionRefusee = uneSuggestion({
        id: 'f781ae20-8838-49c7-aa2e-9b224318fb67',
        dateRefus: uneDatetime()
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
        idJeune: suggestion.idJeune,
        avecDiagoriente: false
      })

      // Then
      const queryModel: SuggestionQueryModel = {
        id: 'f781ae20-8838-49c7-aa2e-9b224318fb65',
        titre: 'Petrisseur',
        type: Offre.Recherche.Type.OFFRES_EMPLOI,
        source: suggestion.source,
        metier: 'Boulanger',
        localisation: 'Lille',
        dateCreation: uneDatetime().toISO(),
        dateRafraichissement: uneDatetime().toISO()
      }
      expect(suggestions).to.deep.equal([queryModel])
    })
  })

  describe('authorize', () => {
    it('autorise un jeune', async () => {
      // When
      await queryHandler.authorize(
        { idJeune: 'idJeune', avecDiagoriente: false },
        unUtilisateurJeune()
      )

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        'idJeune',
        unUtilisateurJeune()
      )
    })
  })
})
