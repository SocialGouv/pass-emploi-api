import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { GetJeunesByStructureMiloQueryHandler } from '../../../src/application/queries/milo/get-jeunes-by-structure-milo.query.handler.db'
import { success } from '../../../src/building-blocks/types/result'
import { unHeaderAuthorization } from '../../fixtures/authentification.fixture'
import { StubbedClass } from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'

describe('StructuresMiloController', () => {
  let getJeunesByStructureMiloQueryHandler: StubbedClass<GetJeunesByStructureMiloQueryHandler>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getJeunesByStructureMiloQueryHandler = app.get(
      GetJeunesByStructureMiloQueryHandler
    )
  })

  describe('GET structures-milo/:id/jeunes?q=<string>', () => {
    it('renvoie une liste de jeunes', async () => {
      getJeunesByStructureMiloQueryHandler.execute
        .withArgs({
          idStructureMilo: 'paris',
          page: 1,
          limit: undefined,
          q: 'name'
        })
        .resolves(
          success({
            pagination: {
              page: 1,
              limit: 1,
              total: 0
            },
            resultats: []
          })
        )

      // When
      await request(app.getHttpServer())
        .get('/structures-milo/paris/jeunes?page=1&q=name')
        .set('authorization', unHeaderAuthorization())

        // Then
        .expect(HttpStatus.OK)
        .expect({
          pagination: {
            page: 1,
            limit: 1,
            total: 0
          },
          resultats: []
        })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/structures-milo/paris/jeunes'
    )
  })
})
