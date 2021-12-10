import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { DeleteActionCommandHandler } from '../../../src/application/commands/delete-action.command.handler'
import { GetDetailActionQueryHandler } from '../../../src/application/queries/get-detail-action.query.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { uneAction } from '../../fixtures/action.fixture'
import { unHeaderAuthorization } from '../../fixtures/authentification.fixture'
import { uneActionQueryModel } from '../../fixtures/query-models/action.query-model.fixtures'
import {
  buildTestingModuleForHttpTesting,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'

let getDetailActionQueryHandler: StubbedClass<GetDetailActionQueryHandler>
let deleteActionCommandHandler: StubbedClass<DeleteActionCommandHandler>
describe('ActionsController', () => {
  getDetailActionQueryHandler = stubClass(GetDetailActionQueryHandler)
  deleteActionCommandHandler = stubClass(DeleteActionCommandHandler)
  let app: INestApplication
  before(async () => {
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(GetDetailActionQueryHandler)
      .useValue(getDetailActionQueryHandler)
      .overrideProvider(DeleteActionCommandHandler)
      .useValue(deleteActionCommandHandler)
      .compile()

    app = testingModule.createNestApplication()
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('GET /actions/:idAction', () => {
    const idAction = '13c11b33-751c-4e1b-a49d-1b5a473ba159'
    it("renvoie l'action demandée", () => {
      // Given
      getDetailActionQueryHandler.execute.resolves(
        uneActionQueryModel({ id: idAction })
      )

      // When - Then
      const actionJson = {
        id: idAction,
        content: "Ceci est un contenu d'action",
        comment: 'Ceci est un commentaire',
        status: 'in_progress',
        creationDate: '2021-11-11T08:03:30.000Z',
        lastUpdate: '2021-11-11T09:03:30.000Z',
        jeune: {
          id: '1',
          lastName: 'Saez',
          firstName: 'Damien'
        },
        creatorType: 'conseiller',
        creator: 'Nils Tavernier'
      }
      return request(app.getHttpServer())
        .get(`/actions/${idAction}`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect(actionJson)
    })

    it("renvoie un code 404 (Not Found) si l'action n'existe pas", () => {
      // Given
      getDetailActionQueryHandler.execute.resolves(undefined)

      // When - Then
      return request(app.getHttpServer())
        .get(`/actions/${idAction}`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.NOT_FOUND)
    })

    ensureUserAuthenticationFailsIfInvalid('get', '/actions/123')
  })
  describe('DELETE /actions/:idAction', () => {
    const idAction = '13c11b33-751c-4e1b-a49d-1b5a473ba159'
    it("supprime l'action demandée", () => {
      // Given
      deleteActionCommandHandler.execute.resolves(emptySuccess())

      // When - Then
      return request(app.getHttpServer())
        .delete(`/actions/${idAction}`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.NO_CONTENT)
    })

    it("renvoie un code 404 (Not Found) si l'action n'existe pas", () => {
      // Given
      const action = uneAction()
      deleteActionCommandHandler.execute.resolves(
        failure(new NonTrouveError('Action', action.id))
      )

      // When - Then
      const actionJson = {
        code: 'NON_TROUVE',
        message: 'Action 721e2108-60f5-4a75-b102-04fe6a40e899 non trouvé(e)'
      }
      return request(app.getHttpServer())
        .delete(`/actions/${idAction}`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.NOT_FOUND)
        .expect(actionJson)
    })

    ensureUserAuthenticationFailsIfInvalid('delete', '/actions/123')
  })
})
