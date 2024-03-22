import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import {
  GetAgendaSessionsConseillerMiloQuery,
  GetAgendaSessionsConseillerMiloQueryHandler
} from 'src/application/queries/milo/get-agenda-sessions-conseiller.milo.query.handler.db'
import { ConseillerMiloSansStructure } from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import { ConseillerMilo } from 'src/domain/milo/conseiller.milo.db'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { unConseillerMilo } from 'test/fixtures/conseiller-milo.fixture'
import { unDetailSessionConseillerDto } from 'test/fixtures/milo-dto.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { SessionConseillerDetailDto } from '../../../../src/infrastructure/clients/dto/milo.dto'
import { KeycloakClient } from '../../../../src/infrastructure/clients/keycloak-client'
import { MiloClient } from '../../../../src/infrastructure/clients/milo-client'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { getDatabase } from '../../../utils/database-for-testing'
import { testConfig } from '../../../utils/module-for-testing'
import { unAgendaConseillerMiloSessionListItemQueryModel } from 'test/fixtures/sessions.fixture'

describe('GetAgendaSessionsConseillerMiloQueryHandler', () => {
  let getAgendaSessionsQueryHandler: GetAgendaSessionsConseillerMiloQueryHandler
  let conseillerRepository: StubbedType<ConseillerMilo.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let miloClient: StubbedClass<MiloClient>
  let keycloakClient: StubbedClass<KeycloakClient>
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    conseillerRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    miloClient = stubClass(MiloClient)
    keycloakClient = stubClass(KeycloakClient)
    getAgendaSessionsQueryHandler =
      new GetAgendaSessionsConseillerMiloQueryHandler(
        miloClient,
        keycloakClient,
        conseillerRepository,
        conseillerAuthorizer,
        testConfig()
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
        accessToken: 'bearer un-token',
        dateDebut: DateTime.fromISO('2023-04-12T00:00:00Z'),
        dateFin: DateTime.fromISO('2023-04-13T00:00:00Z')
      }
      getAgendaSessionsQueryHandler.authorize(query, unUtilisateurConseiller())

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
          accessToken: 'bearer un-token',
          dateDebut: DateTime.fromISO('2023-04-12T00:00:00Z'),
          dateFin: DateTime.fromISO('2023-04-13T00:00:00Z')
        }
        conseillerRepository.get
          .withArgs(query.idConseiller)
          .resolves(
            failure(new ConseillerMiloSansStructure(query.idConseiller))
          )

        // When
        const result = await getAgendaSessionsQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          failure(new ConseillerMiloSansStructure(query.idConseiller))
        )
      })
    })

    describe('quand le conseiller existe', () => {
      const query: GetAgendaSessionsConseillerMiloQuery = {
        idConseiller: 'idConseiller-1',
        accessToken: 'bearer un-token',
        dateDebut: DateTime.fromISO('2023-04-12T00:00:00Z'),
        dateFin: DateTime.fromISO('2023-04-13T00:00:00Z')
      }
      const conseiller = unConseillerMilo({
        id: '1',
        structure: { id: '1', timezone: 'America/Cayenne' }
      })

      beforeEach(async () => {
        conseillerRepository.get
          .withArgs(query.idConseiller)
          .resolves(success(conseiller))

        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(query.accessToken)
          .resolves('idpToken')
      })

      it('récupère la liste des sessions de sa structure Milo auxquelles participent ses jeunes', async () => {
        // Given
        const sessionsDto: SessionConseillerDetailDto[] = getSessionsDto()
        givenSessionsDuConseiller(miloClient, conseiller, query, sessionsDto)
        await ConseillerSqlModel.create(unConseillerDto())
        await JeuneSqlModel.bulkCreate([
          unJeuneDto({ id: 'id-hermione', idPartenaire: '12345' }),
          unJeuneDto({ id: 'id-harry', idPartenaire: '67890' })
        ])

        // When
        const result = await getAgendaSessionsQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          success([unAgendaConseillerMiloSessionListItemQueryModel])
        )
      })
    })
  })
})

function getSessionsDto(): SessionConseillerDetailDto[] {
  return [
    {
      ...unDetailSessionConseillerDto,
      session: {
        ...unDetailSessionConseillerDto.session,
        id: 1,
        instances: [
          {
            idDossier: 12345,
            idInstanceSession: 13579,
            nom: 'Granger',
            prenom: 'Hermione',
            statut: 'ONGOING'
          },
          {
            idDossier: 67890,
            idInstanceSession: 24680,
            nom: 'Potter',
            prenom: 'Harry',
            statut: 'REFUSAL'
          }
        ]
      }
    },
    {
      ...unDetailSessionConseillerDto,
      session: {
        ...unDetailSessionConseillerDto.session,
        id: 2,
        instances: [
          {
            idDossier: 666,
            idInstanceSession: 42,
            nom: 'Weasley',
            prenom: 'Ronald',
            statut: 'ONGOING'
          }
        ]
      }
    }
  ]
}

function givenSessionsDuConseiller(
  miloClient: StubbedClass<MiloClient>,
  conseiller: ConseillerMilo,
  query: GetAgendaSessionsConseillerMiloQuery,
  sessionsDto: SessionConseillerDetailDto[]
): void {
  miloClient.getSessionsConseiller
    .withArgs(
      'idpToken',
      conseiller.structure.id,
      conseiller.structure.timezone,
      {
        periode: {
          dateDebut: query.dateDebut,
          dateFin: query.dateFin
        },
        avecInscrits: true
      }
    )
    .resolves(
      success({
        page: 1,
        nbSessions: 2,
        sessions: sessionsDto
      })
    )
}
