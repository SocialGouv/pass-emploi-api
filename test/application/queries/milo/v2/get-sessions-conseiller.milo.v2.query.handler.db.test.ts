import { describe } from 'mocha'
import { expect, StubbedClass, stubClass } from '../../../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { ConseillerAuthorizer } from '../../../../../src/application/authorizers/conseiller-authorizer'
import { createSandbox, SinonSandbox } from 'sinon'
import { testConfig } from '../../../../utils/module-for-testing'
import { getDatabase } from '../../../../utils/database-for-testing'
import { unUtilisateurConseiller } from '../../../../fixtures/authentification.fixture'
import {
  failure,
  success
} from '../../../../../src/building-blocks/types/result'
import { ConseillerMiloSansStructure } from '../../../../../src/building-blocks/types/domain-error'
import { DateTime } from 'luxon'
import { unConseillerMilo } from '../../../../fixtures/conseiller-milo.fixture'
import { StructureMiloSqlModel } from '../../../../../src/infrastructure/sequelize/models/structure-milo.sql-model'
import { SessionMiloSqlModel } from '../../../../../src/infrastructure/sequelize/models/session-milo.sql-model'
import { unDetailSessionConseillerDto } from '../../../../fixtures/milo-dto.fixture'
import { uneSessionConseillerMiloQueryModel } from '../../../../fixtures/sessions.fixture'
import { GetSessionsConseillerMiloV2QueryHandler } from '../../../../../src/application/queries/milo/v2/get-sessions-conseiller.milo.v2.query.handler.db'
import { GetSessionsConseillerMiloV2QueryGetter } from '../../../../../src/application/queries/query-getters/milo/v2/get-sessions-conseiller.milo.v2.query.getter.db'
import { SessionConseillerMiloQueryModel } from '../../../../../src/application/queries/query-models/sessions.milo.query.model'
import { ConseillerMilo } from '../../../../../src/domain/milo/conseiller.milo.db'

describe('GetSessionsConseillerMilov2QueryHandler', () => {
  let getSessionsQueryHandler: GetSessionsConseillerMiloV2QueryHandler
  let getSessionsQueryGetter: StubbedClass<GetSessionsConseillerMiloV2QueryGetter>
  let conseillerRepository: StubbedType<ConseillerMilo.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    conseillerRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    getSessionsQueryGetter = stubClass(GetSessionsConseillerMiloV2QueryGetter)
    getSessionsQueryHandler = new GetSessionsConseillerMiloV2QueryHandler(
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
      describe('quand le conseiller souhaite recuperer une liste de session paginé', () => {
        const query = {
          idConseiller: 'idConseiller-1',
          accessToken: 'bearer un-token',
          page: undefined,
          filtrerAClore: undefined
        }
        const conseiller = unConseillerMilo({
          structure: { id: '1', timezone: 'America/Cayenne' }
        })

        beforeEach(async () => {
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
          conseillerRepository.get
            .withArgs(query.idConseiller)
            .resolves(success(conseiller))
        })

        it('récupère la liste paginé des sessions de sa structure Milo', async () => {
          // Given
          getSessionsQueryGetter.handle.resolves(
            success([uneSessionConseillerMiloQueryModel])
          )

          // When
          const result = await getSessionsQueryHandler.handle(query)

          // Then
          expect(result).to.deep.equal(
            success({
              pagination: {
                page: 1,
                limit: 10,
                total: 1
              },
              resultats: [uneSessionConseillerMiloQueryModel]
            })
          )
        })
      })
      describe('quand le conseiller souhaite recuperer la 3 eme page', () => {
        const query = {
          idConseiller: 'idConseiller-1',
          accessToken: 'bearer un-token',
          page: 3,
          filtrerAClore: undefined
        }
        const conseiller = unConseillerMilo({
          structure: { id: '1', timezone: 'America/Cayenne' }
        })

        beforeEach(async () => {
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
          conseillerRepository.get
            .withArgs(query.idConseiller)
            .resolves(success(conseiller))
        })

        it('récupère la liste paginé des sessions de sa structure Milo', async () => {
          const uneListeDeSessionQueryModel: SessionConseillerMiloQueryModel[] =
            []
          for (let i = 1; i < 23; i++) {
            uneListeDeSessionQueryModel.push({
              ...uneSessionConseillerMiloQueryModel,
              id: i.toString()
            })
          }
          // Given
          getSessionsQueryGetter.handle.resolves(
            success([...uneListeDeSessionQueryModel])
          )

          // When
          const result = await getSessionsQueryHandler.handle(query)

          // Then
          expect(result).to.deep.equal(
            success({
              pagination: {
                page: 3,
                limit: 10,
                total: 22
              },
              resultats: [
                { ...uneSessionConseillerMiloQueryModel, id: '21' },
                { ...uneSessionConseillerMiloQueryModel, id: '22' }
              ]
            })
          )
        })
      })
    })
  })
})
