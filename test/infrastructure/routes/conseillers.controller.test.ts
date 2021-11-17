import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { CreateActionCommandHandler } from '../../../src/application/commands/create-action.command.handler'
import { success } from '../../../src/building-blocks/types/result'
import { CreateActionPayload } from '../../../src/infrastructure/routes/validation/conseillers.inputs'
import {
  buildTestingModuleForHttpTesting,
  StubbedClass,
  stubClass
} from '../../utils'

describe.skip('ConseillersController', () => {
  let createActionCommandHandler: StubbedClass<CreateActionCommandHandler>
  let app: INestApplication
  before(async () => {
    createActionCommandHandler = stubClass(CreateActionCommandHandler)
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(CreateActionCommandHandler)
      .useValue(createActionCommandHandler)
      .compile()

    app = testingModule.createNestApplication()
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('POST /conseillers/:idConseiller/jeunes/:idJeune/action', () => {
    it("renvoie l'id de l'action créée", () => {
      // Given
      const actionPayload: CreateActionPayload = {
        content: "Ceci est un contenu d'action",
        comment: 'Ceci est un commentaire'
      }
      const idAction = '15916d7e-f13a-4158-b7eb-3936aa937a0a'
      createActionCommandHandler.execute.resolves(success(idAction))

      // When - Then
      return request(app.getHttpServer())
        .post('/conseillers/1/jeunes/ABCDE/action')
        .send(actionPayload)
        .expect(HttpStatus.CREATED)
        .expect({ id: idAction })
    })
  })
})
