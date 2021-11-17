import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { GetDetailActionQueryHandler } from '../../../src/application/queries/get-detail-action.query.handler'
import { uneActionQueryModel } from '../../fixtures/query-models/action.query-model.fixtures'
import {
  buildTestingModuleForHttpTesting,
  StubbedClass,
  stubClass
} from '../../utils'

let getDetailActionQueryHandler: StubbedClass<GetDetailActionQueryHandler>
describe.skip('ActionsController', () => {
  getDetailActionQueryHandler = stubClass(GetDetailActionQueryHandler)
  let app: INestApplication
  before(async () => {
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(GetDetailActionQueryHandler)
      .useValue(getDetailActionQueryHandler)
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
        jeune: { id: '1', lastName: 'Saez', firstName: 'Damien' },
        creatorType: 'conseiller',
        creator: 'Nils Tavernier'
      }
      return request(app.getHttpServer())
        .get(`/actions/${idAction}`)
        .expect(HttpStatus.OK)
        .expect(actionJson)
    })

    it("renvoie un code 404 (Not Found) si l'action n'existe pas", () => {
      // Given
      getDetailActionQueryHandler.execute.resolves(undefined)

      // When - Then
      return request(app.getHttpServer())
        .get(`/actions/${idAction}`)
        .expect(HttpStatus.NOT_FOUND)
    })
  })
})
