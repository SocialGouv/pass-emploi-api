import { DateTime } from 'luxon'
import { describe } from 'mocha'
import { SinonSandbox, createSandbox } from 'sinon'
import { JeuneAuthorizer } from 'src/application/authorizers/jeune-authorizer'
import { GetDetailSessionJeuneMiloQueryHandler } from 'src/application/queries/milo/get-detail-session-jeune.milo.query.handler.db'
import {
  ErreurHttp,
  JeuneMiloSansIdDossier,
  JeuneMiloSansStructure
} from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client.db'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { unUtilisateurJeune } from 'test/fixtures/authentification.fixture'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { uneOffreDto, uneSessionDto } from 'test/fixtures/milo-dto.fixture'
import { unDetailSessionJeuneMiloQueryModel } from 'test/fixtures/sessions.fixture'
import { StubbedClass, expect, stubClass } from 'test/utils'
import { getDatabase } from 'test/utils/database-for-testing'
import { SessionMilo } from '../../../../src/domain/milo/session.milo'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { MILO_REFUS_JEUNE } from '../../../../src/infrastructure/clients/dto/milo.dto'

describe('GetDetailSessionJeuneMiloQueryHandler', () => {
  const idSession = 1
  const jeune = unJeune()
  const query = {
    idSession: idSession.toString(),
    idJeune: jeune.id,
    accessToken: 'token'
  }
  const utilisateur = unUtilisateurJeune()

  let getDetailSessionQueryHandler: GetDetailSessionJeuneMiloQueryHandler
  let keycloakClient: StubbedClass<KeycloakClient>
  let miloClient: StubbedClass<MiloClient>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    keycloakClient = stubClass(KeycloakClient)
    miloClient = stubClass(MiloClient)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    getDetailSessionQueryHandler = new GetDetailSessionJeuneMiloQueryHandler(
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
        query.idJeune,
        utilisateur,
        true
      )
    })
  })

  describe('handle', () => {
    beforeEach(async () => {
      await getDatabase().cleanPG()
      await ConseillerSqlModel.create(unConseillerDto())
    })

    describe("quand le jeune n'a pas de structure", () => {
      it('renvoie une failure', async () => {
        // Given
        await JeuneSqlModel.create(unJeuneDto({ id: jeune.id }))

        // When
        const result = await getDetailSessionQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          failure(new JeuneMiloSansStructure(query.idJeune))
        )
      })
    })

    describe('quand le jeune existe sans ID partenaire', () => {
      it('renvoie une failure', async () => {
        // Given
        await StructureMiloSqlModel.create({
          id: 'paris',
          nomOfficiel: 'Paris',
          timezone: 'Europe/Paris'
        })
        await JeuneSqlModel.create(
          unJeuneDto({
            id: jeune.id,
            idStructureMilo: 'paris',
            idPartenaire: undefined
          })
        )

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
        await StructureMiloSqlModel.create({
          id: 'paris',
          nomOfficiel: 'Paris',
          timezone: 'America/Cayenne'
        })
        await JeuneSqlModel.create(
          unJeuneDto({
            id: jeune.id,
            idStructureMilo: 'paris'
          })
        )
        keycloakClient.exchangeTokenJeune
          .withArgs(query.accessToken, jeune.structure)
          .resolves(idpToken)
      })

      it("renvoie une failure quand l'appel à Milo échoue", async () => {
        // Given
        miloClient.getDetailSessionJeune
          .withArgs(idpToken, query.idSession)
          .resolves(failure(new ErreurHttp('erreur', 500)))

        // When
        const result = await getDetailSessionQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('erreur', 500)))
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
        const dateSession = DateTime.fromFormat(
          '2020-04-06 10:20:00',
          'yyyy-MM-dd HH:mm:ss',
          {
            zone: 'America/Cayenne'
          }
        )
        miloClient.getSessionsParDossierJeune
          .withArgs(idpToken, jeune.idPartenaire, {
            debut: dateSession,
            fin: dateSession
          })
          .resolves(
            success([
              {
                session: uneSessionDto,
                offre: uneOffreDto,
                sessionInstance: { statut: MILO_REFUS_JEUNE }
              }
            ])
          )

        // When
        const result = await getDetailSessionQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          success({
            ...unDetailSessionJeuneMiloQueryModel,
            id: query.idSession,
            inscription: {
              statut: SessionMilo.Inscription.Statut.REFUS_JEUNE
            },
            dateMaxInscription: '2020-04-08T02:59:59.999Z'
          })
        )
      })
    })
  })
})
