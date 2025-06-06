import { DateTime } from 'luxon'
import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { GetSessionsJeuneMiloQueryGetter } from 'src/application/queries/query-getters/milo/get-sessions-jeune.milo.query.getter.db'
import { success } from 'src/building-blocks/types/result'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { getDatabase } from 'test/utils/database-for-testing'
import { SessionMilo } from '../../../../../src/domain/milo/session.milo'
import { MILO_INSCRIT } from '../../../../../src/infrastructure/clients/dto/milo.dto'
import { ConseillerSqlModel } from '../../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { SessionMiloSqlModel } from '../../../../../src/infrastructure/sequelize/models/session-milo.sql-model'
import {
  uneOffreDto,
  uneSessionDto
} from '../../../../fixtures/milo-dto.fixture'
import { uneSessionJeuneMiloQueryModel } from '../../../../fixtures/sessions.fixture'
import { unConseillerDto } from '../../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../../fixtures/sql-models/jeune.sql-model'

describe('GetSessionsJeuneMiloQueryGetter', () => {
  let getSessionsQueryGetter: GetSessionsJeuneMiloQueryGetter
  let oidcClient: StubbedClass<OidcClient>
  let miloClient: StubbedClass<MiloClient>
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    oidcClient = stubClass(OidcClient)
    miloClient = stubClass(MiloClient)
    getSessionsQueryGetter = new GetSessionsJeuneMiloQueryGetter(
      oidcClient,
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
        oidcClient.exchangeTokenConseillerMilo
          .withArgs(accessToken)
          .resolves(idpToken)
        miloClient.getSessionsParDossierJeunePourConseiller
          .withArgs(idpToken, jeuneParis.idPartenaire)
          .resolves(success([]))

        // When
        const result = await getSessionsQueryGetter.handle(
          jeuneParis.id,
          accessToken,
          { pourConseiller: true }
        )

        // Then
        expect(result).to.deep.equal(success([]))
        expect(
          oidcClient.exchangeTokenConseillerMilo
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
          accessToken
        )

        // Then
        expect(result).to.deep.equal(success([]))
        expect(oidcClient.exchangeTokenJeune).not.to.have.been.called()
      })
    })

    describe('quand filtreEstInscrit false', () => {
      it('renvoie les sessions visible avec jeune non inscrit', async () => {
        //Given
        oidcClient.exchangeTokenJeune.withArgs(accessToken).resolves(idpToken)
        miloClient.getSessionsParDossierJeune.withArgs(idpToken).resolves(
          success([
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
          ])
        )
        // When
        const result = await getSessionsQueryGetter.handle(
          jeuneParis.id,
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
        oidcClient.exchangeTokenJeune.withArgs(accessToken).resolves(idpToken)
        miloClient.getSessionsParDossierJeune
          .withArgs(idpToken, jeuneCayenne.idPartenaire)
          .resolves(
            success([
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
            ])
          )
        // When
        const result = await getSessionsQueryGetter.handle(
          jeuneCayenne.id,
          accessToken,
          { filtrerEstInscrit: false }
        )
        // Then
        expect(result).to.deep.equal(
          success([
            uneSessionJeuneMiloQueryModel({
              id: idSession2.toString(),
              dateHeureDebut: '2020-04-07T13:20:00.000Z',
              dateHeureFin: '2020-04-08T13:20:00.000Z',
              dateMaxInscription: '2020-04-08T02:59:59.999Z'
            })
          ])
        )
      })
    })

    describe('quand filtreEstInscrit true', () => {
      it('renvoie toutes les sessions avec jeune inscrit', async () => {
        //Given
        oidcClient.exchangeTokenJeune.withArgs(accessToken).resolves(idpToken)
        miloClient.getSessionsParDossierJeune.withArgs(idpToken).resolves(
          success([
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
          ])
        )
        // When
        const result = await getSessionsQueryGetter.handle(
          jeuneParis.id,
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
        oidcClient.exchangeTokenJeune.withArgs(accessToken).resolves(idpToken)
        miloClient.getSessionsParDossierJeune.withArgs(idpToken).resolves(
          success([
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
          ])
        )
        // When
        const result = await getSessionsQueryGetter.handle(
          jeuneParis.id,
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
