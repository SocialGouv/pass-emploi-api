import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { GetSessionsJeuneMiloQueryGetter } from 'src/application/queries/query-getters/milo/get-sessions-jeune.milo.query.getter.db'
import { success } from 'src/building-blocks/types/result'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client.db'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { getDatabase } from 'test/utils/database-for-testing'
import { JeuneSqlModel } from '../../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../../../fixtures/sql-models/jeune.sql-model'
import { ConseillerSqlModel } from '../../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../../../fixtures/sql-models/conseiller.sql-model'
import { SessionMiloSqlModel } from '../../../../../src/infrastructure/sequelize/models/session-milo.sql-model'
import { DateTime } from 'luxon'
import {
  uneOffreDto,
  uneSessionDto
} from '../../../../fixtures/milo-dto.fixture'
import { uneSessionJeuneMiloQueryModel } from '../../../../fixtures/sessions.fixture'
import { SessionMilo } from '../../../../../src/domain/milo/session.milo'
import { MILO_INSCRIT } from '../../../../../src/infrastructure/clients/dto/milo.dto'

describe('GetSessionsJeuneMiloQueryGetter', () => {
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
    const accessToken = 'accessToken'
    const idpToken = 'idpToken'
    const idStructureParis = 'id-paris'
    const idStructureCayenne = 'id-cayenne'
    const jeuneParis = unJeune({ id: 'paris' })
    const jeuneCayenne = unJeune({ id: 'cayenne' })
    const idSession1 = 11
    const idSession2 = 22
    const sessionNonVisible = uneSessionDto
    const sessionVisible1 = {
      ...uneSessionDto,
      id: idSession1,
      dateHeureDebut: '2020-04-08 10:20:00'
    }
    const sessionVisible2 = {
      ...uneSessionDto,
      id: idSession2,
      dateHeureDebut: '2020-04-07 10:20:00'
    }

    beforeEach(async () => {
      await getDatabase().cleanPG()

      await ConseillerSqlModel.create(unConseillerDto())

      await StructureMiloSqlModel.create({
        id: idStructureParis,
        nomOfficiel: 'Paris',
        timezone: 'Europe/Paris'
      })
      await JeuneSqlModel.create(
        unJeuneDto({ id: jeuneParis.id, idStructureMilo: idStructureParis })
      )

      await StructureMiloSqlModel.create({
        id: idStructureCayenne,
        nomOfficiel: 'Cayenne',
        timezone: 'America/Cayenne'
      })
      await JeuneSqlModel.create(
        unJeuneDto({ id: jeuneCayenne.id, idStructureMilo: idStructureCayenne })
      )

      await SessionMiloSqlModel.create({
        id: idSession1,
        estVisible: true,
        idStructureMilo: idStructureParis,
        dateModification: DateTime.now().toJSDate()
      })
      await SessionMiloSqlModel.create({
        id: idSession2,
        estVisible: true,
        idStructureMilo: idStructureCayenne,
        dateModification: DateTime.now().toJSDate()
      })
    })

    describe("quand c'est un conseiller", () => {
      it('récupère les sessions du jeune pour un conseiller', async () => {
        //Given
        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(accessToken)
          .resolves(idpToken)
        miloClient.getSessionsJeunePourConseiller
          .withArgs(idpToken, jeuneParis.idPartenaire)
          .resolves(success({ page: 1, nbSessions: 0, sessions: [] }))

        // When
        const result = await getSessionsQueryGetter.handle(
          jeuneParis.id,
          jeuneParis.idPartenaire,
          accessToken,
          { pourConseiller: true }
        )

        // Then
        expect(result).to.deep.equal(success([]))
        expect(
          keycloakClient.exchangeTokenConseillerMilo
        ).to.have.been.calledOnceWithExactly(accessToken)
      })
    })

    describe("quand c'est un jeune", () => {
      it("renvoie tableau vide quand le jeune n'a pas de structure", async () => {
        //Given
        const idJeuneSansStructure = 'sans-struct'
        await JeuneSqlModel.create(
          unJeuneDto({ id: idJeuneSansStructure, idStructureMilo: null })
        )

        // When
        const result = await getSessionsQueryGetter.handle(
          idJeuneSansStructure,
          jeuneParis.idPartenaire,
          accessToken
        )

        // Then
        expect(result).to.deep.equal(success([]))
        expect(keycloakClient.exchangeTokenJeune).not.to.have.been.called()
      })
    })

    describe('quand filtreEstInscrit false', () => {
      it('renvoie les sessions visible avec jeune non inscrit', async () => {
        //Given
        keycloakClient.exchangeTokenJeune
          .withArgs(accessToken)
          .resolves(idpToken)
        miloClient.getSessionsJeune
          .withArgs(idpToken, jeuneParis.idPartenaire)
          .resolves(
            success({
              page: 1,
              nbSessions: 3,
              sessions: [
                {
                  session: sessionNonVisible,
                  offre: uneOffreDto
                },
                {
                  session: sessionVisible1,
                  offre: uneOffreDto,
                  sessionInstance: { statut: MILO_INSCRIT }
                },
                {
                  session: sessionVisible2,
                  offre: uneOffreDto
                }
              ]
            })
          )
        // When
        const result = await getSessionsQueryGetter.handle(
          jeuneParis.id,
          jeuneParis.idPartenaire,
          accessToken,
          { filtrerEstInscrit: false }
        )
        // Then
        expect(result).to.deep.equal(
          success([
            uneSessionJeuneMiloQueryModel({
              id: idSession2.toString(),
              dateHeureDebut: '2020-04-07T08:20:00.000Z',
              dateHeureFin: '2020-04-08T08:20:00.000Z'
            })
          ])
        )
      })
      it('applique la bonne timezone', async () => {
        //Given
        keycloakClient.exchangeTokenJeune
          .withArgs(accessToken)
          .resolves(idpToken)
        miloClient.getSessionsJeune
          .withArgs(idpToken, jeuneCayenne.idPartenaire)
          .resolves(
            success({
              page: 1,
              nbSessions: 3,
              sessions: [
                {
                  session: sessionNonVisible,
                  offre: uneOffreDto
                },
                {
                  session: sessionVisible1,
                  offre: uneOffreDto,
                  sessionInstance: { statut: MILO_INSCRIT }
                },
                {
                  session: sessionVisible2,
                  offre: uneOffreDto
                }
              ]
            })
          )
        // When
        const result = await getSessionsQueryGetter.handle(
          jeuneCayenne.id,
          jeuneCayenne.idPartenaire,
          accessToken,
          { filtrerEstInscrit: false }
        )
        // Then
        expect(result).to.deep.equal(
          success([
            uneSessionJeuneMiloQueryModel({
              id: idSession2.toString(),
              dateHeureDebut: '2020-04-07T13:20:00.000Z',
              dateHeureFin: '2020-04-08T13:20:00.000Z'
            })
          ])
        )
      })
    })

    describe('quand filtreEstInscrit true', () => {
      it('renvoie toutes les sessions avec jeune inscrit', async () => {
        //Given
        keycloakClient.exchangeTokenJeune
          .withArgs(accessToken)
          .resolves(idpToken)
        miloClient.getSessionsJeune
          .withArgs(idpToken, jeuneParis.idPartenaire)
          .resolves(
            success({
              page: 1,
              nbSessions: 3,
              sessions: [
                {
                  session: sessionNonVisible,
                  offre: uneOffreDto,
                  sessionInstance: { statut: MILO_INSCRIT }
                },
                {
                  session: sessionVisible1,
                  offre: uneOffreDto,
                  sessionInstance: { statut: MILO_INSCRIT }
                },
                {
                  session: sessionVisible2,
                  offre: uneOffreDto
                }
              ]
            })
          )
        // When
        const result = await getSessionsQueryGetter.handle(
          jeuneParis.id,
          jeuneParis.idPartenaire,
          accessToken,
          { filtrerEstInscrit: true }
        )
        // Then
        expect(result).to.deep.equal(
          success([
            uneSessionJeuneMiloQueryModel({
              dateHeureDebut: '2020-04-06T08:20:00.000Z',
              dateHeureFin: '2020-04-08T08:20:00.000Z',
              inscription: SessionMilo.Inscription.Statut.INSCRIT
            }),
            uneSessionJeuneMiloQueryModel({
              id: idSession1.toString(),
              dateHeureDebut: '2020-04-08T08:20:00.000Z',
              dateHeureFin: '2020-04-08T08:20:00.000Z',
              inscription: SessionMilo.Inscription.Statut.INSCRIT
            })
          ])
        )
      })
    })

    describe('quand filtreEstInscrit vide', () => {
      it('renvoie toutes les sessions avec jeune inscrit + toutes sessions visible avec jeune non inscrit + retire doublons + trie par date', async () => {
        //Given
        keycloakClient.exchangeTokenJeune
          .withArgs(accessToken)
          .resolves(idpToken)
        miloClient.getSessionsJeune
          .withArgs(idpToken, jeuneParis.idPartenaire)
          .resolves(
            success({
              page: 1,
              nbSessions: 3,
              sessions: [
                {
                  session: sessionNonVisible,
                  offre: uneOffreDto,
                  sessionInstance: { statut: MILO_INSCRIT }
                },
                {
                  session: sessionVisible1,
                  offre: uneOffreDto,
                  sessionInstance: { statut: MILO_INSCRIT }
                },
                {
                  session: sessionVisible2,
                  offre: uneOffreDto
                }
              ]
            })
          )
        // When
        const result = await getSessionsQueryGetter.handle(
          jeuneParis.id,
          jeuneParis.idPartenaire,
          accessToken
        )
        // Then
        expect(result).to.deep.equal(
          success([
            uneSessionJeuneMiloQueryModel({
              dateHeureDebut: '2020-04-06T08:20:00.000Z',
              dateHeureFin: '2020-04-08T08:20:00.000Z',
              inscription: SessionMilo.Inscription.Statut.INSCRIT
            }),
            uneSessionJeuneMiloQueryModel({
              id: idSession2.toString(),
              dateHeureDebut: '2020-04-07T08:20:00.000Z',
              dateHeureFin: '2020-04-08T08:20:00.000Z'
            }),
            uneSessionJeuneMiloQueryModel({
              id: idSession1.toString(),
              dateHeureDebut: '2020-04-08T08:20:00.000Z',
              dateHeureFin: '2020-04-08T08:20:00.000Z',
              inscription: SessionMilo.Inscription.Statut.INSCRIT
            })
          ])
        )
      })
    })
  })
})
