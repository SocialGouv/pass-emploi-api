import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../../src/application/authorizers/conseiller-authorizer'
import {
  GetSessionsMiloQuery,
  GetSessionsMiloQueryHandler
} from '../../../../src/application/queries/milo/get-sessions.milo.query.handler.db'
import { ConseillerMiloSansStructure } from '../../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../../src/building-blocks/types/result'
import { ConseillerMilo } from '../../../../src/domain/milo/conseiller.milo'
import { KeycloakClient } from '../../../../src/infrastructure/clients/keycloak-client'
import { MiloClient } from '../../../../src/infrastructure/clients/milo-client'
import { StructureMiloSqlModel } from '../../../../src/infrastructure/sequelize/models/structure-milo.sql-model'
import { unUtilisateurConseiller } from '../../../fixtures/authentification.fixture'
import { unConseillerMilo } from '../../../fixtures/conseiller-milo.fixture'
import { uneSessionConseillerListeDto } from '../../../fixtures/milo-dto.fixture'
import { uneSessionConseillerMiloQueryModel } from '../../../fixtures/sessions.fixture'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { getDatabase } from '../../../utils/database-for-testing'

describe('GetSessionsQueryHandler', () => {
  let getSessionsQueryHandler: GetSessionsMiloQueryHandler
  let miloClient: StubbedClass<MiloClient>
  let keycloakClient: StubbedClass<KeycloakClient>
  let conseillerRepository: StubbedType<ConseillerMilo.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()

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
  })

  afterEach(() => {
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

    it('Récupère la liste des sessions de sa structure Milo quand le conseiller existe', async () => {
      // Given
      const query: GetSessionsMiloQuery = {
        idConseiller: 'idConseiller-1',
        token: 'bearer un-token',
        dateDebut: DateTime.fromISO('2023-04-12T00:00:00Z'),
        dateFin: DateTime.fromISO('2023-04-13T00:00:00Z')
      }
      const idpToken = 'idpToken'
      const conseiller = unConseillerMilo()

      keycloakClient.exchangeTokenConseillerMilo
        .withArgs(query.token)
        .resolves(idpToken)
      conseillerRepository.get
        .withArgs(query.idConseiller)
        .resolves(success(conseiller))
      miloClient.getSessionsConseiller
        .withArgs(
          idpToken,
          conseiller.idStructure,
          query.dateDebut,
          query.dateFin,
          'America/Cayenne'
        )
        .resolves(success(uneSessionConseillerListeDto))
      await StructureMiloSqlModel.create({
        id: conseiller.idStructure,
        nomOfficiel: 'Structure Milo',
        timezone: 'America/Cayenne'
      })

      // When
      const result = await getSessionsQueryHandler.handle(query)

      // Then
      expect(result).to.deep.equal(
        success([uneSessionConseillerMiloQueryModel()])
      )
    })
  })
})
