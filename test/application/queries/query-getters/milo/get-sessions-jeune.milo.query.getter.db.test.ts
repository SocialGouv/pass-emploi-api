import { DateTime } from 'luxon'
import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { GetSessionsJeuneMiloQueryGetter } from 'src/application/queries/query-getters/milo/get-sessions-jeune.milo.query.getter.db'
import { success } from 'src/building-blocks/types/result'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { uneOffreDto, uneSessionDto } from 'test/fixtures/milo-dto.fixture'
import { uneSessionJeuneMiloQueryModel } from 'test/fixtures/sessions.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { getDatabase } from 'test/utils/database-for-testing'

describe('GetSessionsJeuneMiloQueryGetter', () => {
  const jeune = unJeune()

  let getSessionsQueryGetter: GetSessionsJeuneMiloQueryGetter
  let keycloakClient: StubbedClass<KeycloakClient>
  let miloClient: StubbedClass<MiloClient>
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    keycloakClient = stubClass(KeycloakClient)
    miloClient = stubClass(MiloClient)
    getSessionsQueryGetter = new GetSessionsJeuneMiloQueryGetter(
      keycloakClient,
      miloClient
    )
  })

  after(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    const idpToken = 'idpToken'
    const idStructureParis = 'id-paris'
    const idStructureCayenne = 'id-cayenne'
    const idSession1 = 1
    const idSession2 = 2
    const idSession3 = 3

    beforeEach(async () => {
      keycloakClient.exchangeTokenJeune
        .withArgs('token', jeune.structure)
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
              nbSessions: 2,
              sessions: [
                {
                  session: sessionNonVisible,
                  offre: uneOffreDto,
                  sessionInstance: { statut: 'ONGOING' }
                },
                {
                  session: sessionVisibleACayenne,
                  offre: uneOffreDto,
                  sessionInstance: { statut: 'ONGOING' }
                }
              ]
            })
          )

        // When
        const result = await getSessionsQueryGetter.handle(
          jeune.idPartenaire,
          'token'
        )

        // Then
        expect(result).to.deep.equal(
          success([
            {
              ...uneSessionJeuneMiloQueryModel,
              id: idSession3.toString(),
              inscription: 'INSCRIT'
            }
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
                {
                  session: sessionVisibleAParis,
                  offre: uneOffreDto,
                  sessionInstance: { statut: 'ONGOING' }
                }
              ]
            })
          )

        // When
        const result = await getSessionsQueryGetter.handle(
          jeune.idPartenaire,
          'token'
        )

        // Then
        const dateHeureDebutTimeZoneParis = '2020-04-06T08:20:00.000Z'
        const dateHeureFinTimeZoneParis = '2020-04-08T08:20:00.000Z'
        expect(result).to.deep.equal(
          success([
            {
              ...uneSessionJeuneMiloQueryModel,
              id: idSession2.toString(),
              dateHeureDebut: dateHeureDebutTimeZoneParis,
              dateHeureFin: dateHeureFinTimeZoneParis,
              inscription: 'INSCRIT'
            }
          ])
        )
      })

      it('sur une période donnée si elle est renseignée', async () => {
        // Given
        const periode = {
          debut: DateTime.local(2022),
          fin: DateTime.local(2023)
        }
        miloClient.getSessionsJeune
          .withArgs(idpToken, jeune.idPartenaire, periode)
          .resolves(
            success({
              page: 1,
              nbSessions: 1,
              sessions: [
                {
                  session: sessionVisibleACayenne,
                  offre: uneOffreDto,
                  sessionInstance: { statut: 'ONGOING' }
                }
              ]
            })
          )

        // When
        const result = await getSessionsQueryGetter.handle(
          jeune.idPartenaire,
          'token',
          { periode }
        )

        // Then
        expect(result).to.deep.equal(
          success([
            {
              ...uneSessionJeuneMiloQueryModel,
              id: idSession3.toString(),
              inscription: 'INSCRIT'
            }
          ])
        )
      })

      it('permet de garder celles auxquelles le jeune n’est pas inscrit', async () => {
        // Given
        miloClient.getSessionsJeune
          .withArgs(idpToken, jeune.idPartenaire)
          .resolves(
            success({
              page: 1,
              nbSessions: 3,
              sessions: [
                {
                  session: sessionVisibleACayenne,
                  offre: uneOffreDto,
                  sessionInstance: { statut: 'ONGOING' }
                },
                {
                  session: sessionVisibleACayenne,
                  offre: uneOffreDto,
                  sessionInstance: { statut: 'REFUSAL_YOUNG' }
                },
                {
                  session: sessionVisibleACayenne,
                  offre: uneOffreDto,
                  sessionInstance: { statut: 'REFUSAL' }
                },
                {
                  session: sessionVisibleACayenne,
                  offre: uneOffreDto
                }
              ]
            })
          )

        // When
        const result = await getSessionsQueryGetter.handle(
          jeune.idPartenaire,
          'token',
          { keepAllSessionsFromStructure: true }
        )

        // Then
        expect(result).to.deep.equal(
          success([
            {
              ...uneSessionJeuneMiloQueryModel,
              id: idSession3.toString(),
              inscription: SessionMilo.Inscription.Statut.INSCRIT
            },
            {
              ...uneSessionJeuneMiloQueryModel,
              id: idSession3.toString(),
              inscription: SessionMilo.Inscription.Statut.REFUS_JEUNE
            },
            {
              ...uneSessionJeuneMiloQueryModel,
              id: idSession3.toString(),
              inscription: SessionMilo.Inscription.Statut.REFUS_TIERS
            },
            {
              ...uneSessionJeuneMiloQueryModel,
              id: idSession3.toString()
            }
          ])
        )
      })
    })
  })
})
