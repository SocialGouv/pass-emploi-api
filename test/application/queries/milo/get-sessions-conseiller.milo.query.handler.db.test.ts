import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { GetSessionsConseillerMiloQueryHandler } from 'src/application/queries/milo/get-sessions-conseiller.milo.query.handler.db'
import { ConseillerMiloSansStructure } from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import { ConseillerMilo } from 'src/domain/milo/conseiller.milo.db'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { unConseillerMilo } from 'test/fixtures/conseiller-milo.fixture'
import { unDetailSessionConseillerDto } from 'test/fixtures/milo-dto.fixture'
import { uneSessionConseillerMiloQueryModel } from 'test/fixtures/sessions.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { DateTime } from 'luxon'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { getDatabase } from 'test/utils/database-for-testing'
import { GetSessionsConseillerMiloQueryGetter } from '../../../../src/application/queries/query-getters/milo/get-sessions-conseiller.milo.query.getter.db'
import { testConfig } from '../../../utils/module-for-testing'

describe('GetSessionsConseillerMiloQueryHandler', () => {
  let getSessionsQueryHandler: GetSessionsConseillerMiloQueryHandler
  let getSessionsQueryGetter: StubbedClass<GetSessionsConseillerMiloQueryGetter>
  let conseillerRepository: StubbedType<ConseillerMilo.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    conseillerRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    getSessionsQueryGetter = stubClass(GetSessionsConseillerMiloQueryGetter)
    getSessionsQueryHandler = new GetSessionsConseillerMiloQueryHandler(
      getSessionsQueryGetter,
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
        accessToken: 'bearer un-token'
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
          accessToken: 'bearer un-token'
        }
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
        accessToken: 'bearer un-token',
        dateDebut: DateTime.fromISO('2023-04-12T00:00:00Z'),
        dateFin: DateTime.fromISO('2023-04-13T00:00:00Z')
      }
      const conseiller = unConseillerMilo({
        structureMilo: { id: '1', timezone: 'America/Cayenne' }
      })

      beforeEach(async () => {
        await StructureMiloSqlModel.create({
          id: conseiller.structureMilo.id,
          nomOfficiel: 'Structure Milo',
          timezone: conseiller.structureMilo.timezone
        })
        await SessionMiloSqlModel.create({
          id: unDetailSessionConseillerDto.session.id,
          estVisible: true,
          idStructureMilo: conseiller.structureMilo.id,
          dateModification: DateTime.now().toJSDate()
        })
        conseillerRepository.get
          .withArgs(query.idConseiller)
          .resolves(success(conseiller))
      })

      it('récupère la liste des sessions de sa structure Milo avec une visibilité', async () => {
        // Given
        getSessionsQueryGetter.handle.resolves(
          success([uneSessionConseillerMiloQueryModel])
        )

        // When
        const result = await getSessionsQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          success([uneSessionConseillerMiloQueryModel])
        )
      })
    })
  })
})
