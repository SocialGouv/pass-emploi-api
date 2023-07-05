import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { unUtilisateurJeune } from 'test/fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { GetSessionsJeuneMiloQueryHandler } from 'src/application/queries/milo/get-sessions-jeune.milo.query.handler.db'
import { JeuneAuthorizer } from 'src/application/authorizers/jeune-authorizer'
import { Jeune } from 'src/domain/jeune/jeune'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { failure, success } from 'src/building-blocks/types/result'
import {
  JeuneMiloSansIdDossier,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { uneSessionJeuneMiloQueryModel } from 'test/fixtures/sessions.fixture'
import { uneOffreDto, uneSessionDto } from 'test/fixtures/milo-dto.fixture'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { DateTime } from 'luxon'
import { getDatabase } from 'test/utils/database-for-testing'

describe('GetSessionsJeuneMiloQueryHandler', () => {
  const query = { idJeune: 'idJeune', token: 'token' }
  const jeune = unJeune()
  const utilisateur = unUtilisateurJeune()

  let getSessionsQueryHandler: GetSessionsJeuneMiloQueryHandler
  let jeuneRepository: StubbedType<Jeune.Repository>
  let keycloakClient: StubbedClass<KeycloakClient>
  let miloClient: StubbedClass<MiloClient>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    jeuneRepository = stubInterface(sandbox)
    keycloakClient = stubClass(KeycloakClient)
    miloClient = stubClass(MiloClient)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    getSessionsQueryHandler = new GetSessionsJeuneMiloQueryHandler(
      jeuneRepository,
      keycloakClient,
      miloClient,
      jeuneAuthorizer
    )
  })

  after(() => {
    sandbox.restore()
  })

  describe('authorize', () => {
    it('autorise un jeune Milo', () => {
      // When
      getSessionsQueryHandler.authorize(query, utilisateur)

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        'idJeune',
        utilisateur,
        true
      )
    })
  })

  describe('handle', () => {
    describe("quand le jeune n'existe pas", () => {
      it('renvoie une failure ', async () => {
        // Given
        jeuneRepository.get.withArgs(query.idJeune).resolves(undefined)

        // When
        const result = await getSessionsQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', query.idJeune))
        )
      })
    })

    describe('quand le jeune existe sans ID partenaire', () => {
      it('renvoie une failure ', async () => {
        // Given
        jeuneRepository.get
          .withArgs(query.idJeune)
          .resolves({ ...jeune, idPartenaire: undefined })

        // When
        const result = await getSessionsQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          failure(new JeuneMiloSansIdDossier(query.idJeune))
        )
      })
    })

    describe('quand le jeune existe avec un ID partenaire', () => {
      const idpToken = 'idpToken'
      const idStructureParis = 'id-paris'
      const idStructureCayenne = 'id-cayenne'
      const idSession1 = 1
      const idSession2 = 2
      const idSession3 = 3

      beforeEach(async () => {
        jeuneRepository.get.withArgs(query.idJeune).resolves(jeune)
        keycloakClient.exchangeTokenJeune
          .withArgs(query.token, jeune.structure)
          .resolves(idpToken)

        await StructureMiloSqlModel.create({
          id: idStructureParis,
          nomOfficiel: 'Paris',
          timezone: 'Europe/Paris'
        })
        await StructureMiloSqlModel.create({
          id: idStructureCayenne,
          nomOfficiel: 'Cayenne',
          timezone: 'America/Cayenne'
        })
        await SessionMiloSqlModel.create({
          id: idSession2,
          estVisible: true,
          idStructureMilo: idStructureParis,
          dateModification: DateTime.now().toJSDate()
        })
        await SessionMiloSqlModel.create({
          id: idSession3,
          estVisible: true,
          idStructureMilo: idStructureCayenne,
          dateModification: DateTime.now().toJSDate()
        })
      })

      afterEach(async () => {
        await getDatabase().cleanPG()
      })

      describe('récupère la liste des sessions du jeune et les retourne', () => {
        const sessionNonVisible = { ...uneSessionDto, id: idSession1 }
        const sessionVisibleAParis = { ...uneSessionDto, id: idSession2 }
        const sessionVisibleACayenne = { ...uneSessionDto, id: idSession3 }

        it('seulement si elles sont visibles', async () => {
          // Given
          miloClient.getSessionsJeune
            .withArgs(idpToken, jeune.idPartenaire)
            .resolves(
              success({
                page: 1,
                nbSessions: 1,
                sessions: [
                  { session: sessionNonVisible, offre: uneOffreDto },
                  { session: sessionVisibleACayenne, offre: uneOffreDto }
                ]
              })
            )

          // When
          const result = await getSessionsQueryHandler.handle(query)

          // Then
          expect(result).to.deep.equal(
            success([
              { ...uneSessionJeuneMiloQueryModel, id: idSession3.toString() }
            ])
          )
        })

        it('à la timezone de leur structure', async () => {
          // Given
          miloClient.getSessionsJeune
            .withArgs(idpToken, jeune.idPartenaire)
            .resolves(
              success({
                page: 1,
                nbSessions: 1,
                sessions: [
                  { session: sessionVisibleAParis, offre: uneOffreDto }
                ]
              })
            )

          // When
          const result = await getSessionsQueryHandler.handle(query)

          // Then
          const dateHeureDebutTimeZoneParis = '2020-04-06T08:20:00.000Z'
          const dateHeureFinTimeZoneParis = '2020-04-08T08:20:00.000Z'
          expect(result).to.deep.equal(
            success([
              {
                ...uneSessionJeuneMiloQueryModel,
                id: idSession2.toString(),
                dateHeureDebut: dateHeureDebutTimeZoneParis,
                dateHeureFin: dateHeureFinTimeZoneParis
              }
            ])
          )
        })
      })
    })
  })
})
