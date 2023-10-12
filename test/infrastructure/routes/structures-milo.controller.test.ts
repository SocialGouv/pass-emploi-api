import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { GetJeunesByStructureMiloQueryHandler } from '../../../src/application/queries/milo/get-jeunes-by-structure-milo.query.handler.db'
import {
  emptySuccess,
  success
} from '../../../src/building-blocks/types/result'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { expect, StubbedClass } from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'
import { CloturerAnimationCollectiveCommandHandler } from '../../../src/application/commands/cloturer-animation-collective.command.handler'

describe('StructuresMiloController', () => {
  let getJeunesByStructureMiloQueryHandler: StubbedClass<GetJeunesByStructureMiloQueryHandler>
  let cloturerAnimationCollectiveCommandHandler: StubbedClass<CloturerAnimationCollectiveCommandHandler>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getJeunesByStructureMiloQueryHandler = app.get(
      GetJeunesByStructureMiloQueryHandler
    )
    cloturerAnimationCollectiveCommandHandler = app.get(
      CloturerAnimationCollectiveCommandHandler
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
  describe('POST animation-collectives/:idAnimationCollective/cloturer', () => {
    it('cloture une animation collective', async () => {
      //Given
      const idsJeunes = ['1']
      const idAnimationCollective = '15916d7e-f13a-4158-b7eb-3936aa937a0a'
      cloturerAnimationCollectiveCommandHandler.execute.resolves(emptySuccess())

      //When
      await request(app.getHttpServer())
        .post(
          `/structures-milo/animations-collectives/${idAnimationCollective}/cloturer`
        )
        .set('authorization', unHeaderAuthorization())
        .send({ idsJeunes })
        .expect(HttpStatus.CREATED)
      //Then
      expect(
        cloturerAnimationCollectiveCommandHandler.execute
      ).to.have.been.calledWithExactly(
        { idAnimationCollective, idsJeunes },
        unUtilisateurDecode()
      )
    })
    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/structures-milo/animations-collectives/123/cloturer'
    )
  })
})
