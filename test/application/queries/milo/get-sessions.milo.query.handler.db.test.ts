import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { describe } from 'mocha'
import { SinonSandbox, createSandbox } from 'sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { GetSessionsMiloQueryHandler } from 'src/application/queries/milo/get-sessions.milo.query.handler.db'
import { ConseillerMiloSansStructure } from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import { ConseillerMilo } from 'src/domain/milo/conseiller.milo'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { unConseillerMilo } from 'test/fixtures/conseiller-milo.fixture'
import {
  unDetailSessionConseillerDto,
  uneSessionConseillerListeDto
} from 'test/fixtures/milo-dto.fixture'
import { uneSessionConseillerMiloQueryModel } from 'test/fixtures/sessions.fixture'
import { StubbedClass, expect, stubClass } from 'test/utils'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { DateTime } from 'luxon'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { getDatabase } from 'test/utils/database-for-testing'

describe('GetSessionsQueryHandler', () => {
  const idStructureMilo = 'id-structure-1'
  let getSessionsQueryHandler: GetSessionsMiloQueryHandler
  let miloClient: StubbedClass<MiloClient>
  let keycloakClient: StubbedClass<KeycloakClient>
  let conseillerRepository: StubbedType<ConseillerMilo.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    miloClient = stubClass(MiloClient)
    keycloakClient = stubClass(KeycloakClient)
    conseillerRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    getSessionsQueryHandler = new GetSessionsMiloQueryHandler(
      miloClient,
      conseillerRepository,
      conseillerAuthorizer,
      keycloakClient
    )

    await StructureMiloSqlModel.create({
      id: idStructureMilo,
      nomOfficiel: 'nom-officiel',
      timezone: 'America/Cayenne'
    })

    await SessionMiloSqlModel.create({
      id: unDetailSessionConseillerDto.session.id,
      estVisible: true,
      idStructureMilo: idStructureMilo,
      dateModification: DateTime.now().toJSDate()
    })
  })

  afterEach(async () => {
    await getDatabase().cleanPG()
  })

  after(() => {
    sandbox.restore()
  })

  describe('authorize', () => {
    it('autorise un conseiller Milo', () => {
      // When
      const query = {
        idConseiller: 'idConseiller',
        token: 'bearer un-token'
      }
      getSessionsQueryHandler.authorize(query, unUtilisateurConseiller())

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(
        'idConseiller',
        unUtilisateurConseiller(),
        true
      )
    })
  })

  describe('handle', () => {
    it("Renvoie une failure quand le conseiller Milo n'existe pas", async () => {
      // Given
      const query = {
        idConseiller: 'idConseiller-1',
        token: 'bearer un-token'
      }
      const idpToken = 'idpToken'
      keycloakClient.exchangeTokenConseillerMilo
        .withArgs(query.token)
        .resolves(idpToken)
      conseillerRepository.get
        .withArgs(query.idConseiller)
        .resolves(failure(new ConseillerMiloSansStructure(query.idConseiller)))

      // When
      const result = await getSessionsQueryHandler.handle(query)

      // Then
      expect(result).to.deep.equal(
        failure(new ConseillerMiloSansStructure(query.idConseiller))
      )
    })

    describe('Quand le conseiller existe', () => {
      const query = {
        idConseiller: 'idConseiller-1',
        token: 'bearer un-token',
        dateDebut: DateTime.fromISO('2023-04-12T00:00:00Z'),
        dateFin: DateTime.fromISO('2023-04-13T00:00:00Z')
      }
      const idpToken = 'idpToken'
      const conseiller = unConseillerMilo({
        structure: { id: idStructureMilo, timezone: 'America/Cayenne' }
      })

      beforeEach(async () => {
        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(query.token)
          .resolves(idpToken)
        conseillerRepository.get
          .withArgs(query.idConseiller)
          .resolves(success(conseiller))
      })

      it('Récupère la liste des sessions de sa structure Milo', async () => {
        // Given
        miloClient.getSessionsConseiller
          .withArgs(
            idpToken,
            conseiller.structure.id,
            'America/Cayenne',
            query.dateDebut,
            query.dateFin
          )
          .resolves(success(uneSessionConseillerListeDto))

        // When
        const result = await getSessionsQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          success([
            { ...uneSessionConseillerMiloQueryModel(), estVisible: true }
          ])
        )
      })

      it('Affecte une visibilité à false si la session n’existe pas en base', async () => {
        // Given
        miloClient.getSessionsConseiller
          .withArgs(
            idpToken,
            conseiller.structure.id,
            'America/Cayenne',
            query.dateDebut,
            query.dateFin
          )
          .resolves(
            success({
              page: 1,
              nbSessions: 1,
              sessions: [
                {
                  ...unDetailSessionConseillerDto,
                  session: { ...unDetailSessionConseillerDto.session, id: 2 }
                }
              ]
            })
          )

        // When
        const result = await getSessionsQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          success([
            {
              ...uneSessionConseillerMiloQueryModel(),
              id: '2',
              estVisible: false
            }
          ])
        )
      })
    })
  })
})
