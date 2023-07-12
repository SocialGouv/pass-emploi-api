import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { unUtilisateurJeune } from 'test/fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
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
import { uneOffreDto, uneSessionDto } from 'test/fixtures/milo-dto.fixture'
import { GetDetailSessionJeuneMiloQueryHandler } from 'src/application/queries/milo/get-detail-session-jeune.milo.query.handler.db'
import { getDatabase } from 'test/utils/database-for-testing'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { DateTime } from 'luxon'
import { unDetailSessionJeuneMiloQueryModel } from 'test/fixtures/sessions.fixture'

describe('GetDetailSessionJeuneMiloQueryHandler', () => {
  const idSession = 1
  const query = {
    idSession: idSession.toString(),
    idJeune: 'idJeune',
    token: 'token'
  }
  const jeune = unJeune()
  const utilisateur = unUtilisateurJeune()

  let getDetailSessionQueryHandler: GetDetailSessionJeuneMiloQueryHandler
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
    getDetailSessionQueryHandler = new GetDetailSessionJeuneMiloQueryHandler(
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
      getDetailSessionQueryHandler.authorize(query, utilisateur)

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
        const result = await getDetailSessionQueryHandler.handle(query)

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
        const result = await getDetailSessionQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          failure(new JeuneMiloSansIdDossier(query.idJeune))
        )
      })
    })

    describe('quand le jeune existe avec un ID partenaire', () => {
      const idpToken = 'idpToken'

      beforeEach(async () => {
        jeuneRepository.get.withArgs(query.idJeune).resolves(jeune)
        keycloakClient.exchangeTokenJeune
          .withArgs(query.token, jeune.structure)
          .resolves(idpToken)
      })

      describe('si la session n’est pas visible', () => {
        it('renvoie une failure ', async () => {
          // Given
          miloClient.getDetailSessionJeune
            .withArgs(idpToken, query.idSession)
            .resolves(
              success({
                session: { ...uneSessionDto, id: idSession },
                offre: uneOffreDto
              })
            )

          // When
          const result = await getDetailSessionQueryHandler.handle(query)

          // Then
          expect(result).to.deep.equal(
            failure(new NonTrouveError('Session', query.idSession))
          )
        })
      })

      describe('si la session est visible', () => {
        const idStructure = 'idStructure'
        beforeEach(async () => {
          await StructureMiloSqlModel.create({
            id: idStructure,
            nomOfficiel: 'Cayenne',
            timezone: 'America/Cayenne'
          })
          await SessionMiloSqlModel.create({
            id: query.idSession,
            estVisible: true,
            idStructureMilo: idStructure,
            dateModification: DateTime.now().toJSDate()
          })
        })

        afterEach(async () => {
          await getDatabase().cleanPG()
        })

        it('renvoie le détail de la session à la timezone de sa structure', async () => {
          // Given
          miloClient.getDetailSessionJeune
            .withArgs(idpToken, query.idSession)
            .resolves(
              success({
                session: { ...uneSessionDto, id: idSession },
                offre: uneOffreDto
              })
            )

          // When
          const result = await getDetailSessionQueryHandler.handle(query)

          // Then
          expect(result).to.deep.equal(
            success({
              ...unDetailSessionJeuneMiloQueryModel,
              id: query.idSession
            })
          )
        })
      })
    })
  })
})
