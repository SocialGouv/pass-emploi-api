import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { GetSessionsConseillerMiloQueryHandler } from 'src/application/queries/milo/get-sessions-conseiller.milo.query.handler.db'
import { ConseillerMiloSansStructure } from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import { ConseillerMilo } from 'src/domain/milo/conseiller.milo'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { unConseillerMilo } from 'test/fixtures/conseiller-milo.fixture'
import {
  unDetailSessionConseillerDto,
  uneListeSessionsConseillerDto
} from 'test/fixtures/milo-dto.fixture'
import { uneSessionConseillerMiloQueryModel } from 'test/fixtures/sessions.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { DateTime } from 'luxon'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { getDatabase } from 'test/utils/database-for-testing'

describe('GetSessionsConseillerMiloQueryHandler', () => {
  let getSessionsQueryHandler: GetSessionsConseillerMiloQueryHandler
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
    getSessionsQueryHandler = new GetSessionsConseillerMiloQueryHandler(
      miloClient,
      conseillerRepository,
      conseillerAuthorizer,
      keycloakClient
    )
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
    describe("quand le conseiller n'existe pas", () => {
      it('renvoie une failure ', async () => {
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
          .resolves(
            failure(new ConseillerMiloSansStructure(query.idConseiller))
          )

        // When
        const result = await getSessionsQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          failure(new ConseillerMiloSansStructure(query.idConseiller))
        )
      })
    })

    describe('quand le conseiller existe', () => {
      const query = {
        idConseiller: 'idConseiller-1',
        token: 'bearer un-token',
        dateDebut: DateTime.fromISO('2023-04-12T00:00:00Z'),
        dateFin: DateTime.fromISO('2023-04-13T00:00:00Z')
      }
      const idpToken = 'idpToken'
      const conseiller = unConseillerMilo({
        structure: { id: '1', timezone: 'America/Cayenne' }
      })

      before(async () => {
        await StructureMiloSqlModel.create({
          id: conseiller.structure.id,
          nomOfficiel: 'Structure Milo',
          timezone: conseiller.structure.timezone
        })
        await SessionMiloSqlModel.create({
          id: unDetailSessionConseillerDto.session.id,
          estVisible: true,
          idStructureMilo: conseiller.structure.id,
          dateModification: DateTime.now().toJSDate()
        })
      })

      it('récupère la liste des sessions de sa structure Milo avec une visibilité', async () => {
        // Given
        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(query.token)
          .resolves(idpToken)
        conseillerRepository.get
          .withArgs(query.idConseiller)
          .resolves(success(conseiller))
        miloClient.getSessionsConseiller
          .withArgs(
            idpToken,
            conseiller.structure.id,
            conseiller.structure.timezone,
            query.dateDebut,
            query.dateFin
          )
          .resolves(success(uneListeSessionsConseillerDto))

        // When
        const result = await getSessionsQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          success([{ ...uneSessionConseillerMiloQueryModel, estVisible: true }])
        )
      })

      it('affecte une visibilité à false si la session n’existe pas en base', async () => {
        // Given
        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(query.token)
          .resolves(idpToken)
        conseillerRepository.get
          .withArgs(query.idConseiller)
          .resolves(success(conseiller))
        miloClient.getSessionsConseiller
          .withArgs(
            idpToken,
            conseiller.structure.id,
            conseiller.structure.timezone,
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
              ...uneSessionConseillerMiloQueryModel,
              id: '2',
              estVisible: false
            }
          ])
        )
      })
    })
  })
})
