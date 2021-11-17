import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { CreateActionCommandHandler } from '../../../src/application/commands/create-action.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Action } from '../../../src/domain/action'
import { CreateActionAvecStatutPayload } from '../../../src/infrastructure/routes/validation/conseillers.inputs'
import {
  buildTestingModuleForHttpTesting,
  StubbedClass,
  stubClass
} from '../../utils'
import StatutInvalide = Action.StatutInvalide

describe.skip('JeunesController', () => {
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

  describe('POST /jeunes/:idJeune/action', () => {
    const actionPayload: CreateActionAvecStatutPayload = {
      content: "Ceci est un contenu d'action",
      comment: 'Ceci est un commentaire',
      status: Action.Statut.EN_COURS
    }
    it("renvoie l'id de l'action créée", () => {
      // Given
      const idAction = 'a40a178e-9562-416f-ad9d-42dfbc663a8a'
      createActionCommandHandler.execute.resolves(success(idAction))

      return request(app.getHttpServer())
        .post('/jeunes/ABCDE/action')
        .send(actionPayload)
        .expect(HttpStatus.CREATED)
        .expect({ id: idAction })
    })

    it("renvoie une 404 (Not Found) quand le jeune n'existe pas", async () => {
      const echec = failure(new NonTrouveError('Jeune', 'ABCDE'))
      createActionCommandHandler.execute.resolves(echec)

      return request(app.getHttpServer())
        .post('/jeunes/ABCDE/action')
        .send(actionPayload)
        .expect(HttpStatus.NOT_FOUND)
        .expect({
          message: echec.error.message,
          statusCode: HttpStatus.NOT_FOUND
        })
    })

    it('renvoie une 400 (Bad Request) quand le statuts est incorrect', async () => {
      const echec = failure(new StatutInvalide('whatever_status'))
      createActionCommandHandler.execute.resolves(echec)

      return request(app.getHttpServer())
        .post('/jeunes/ABCDE/action')
        .send(actionPayload)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message: echec.error.message,
          statusCode: HttpStatus.BAD_REQUEST
        })
    })
  })
})
