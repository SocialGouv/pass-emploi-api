import { INestApplication } from '@nestjs/common'
import {
  buildTestingModuleForHttpTesting,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { CreateEvenementCommandHandler } from '../../../src/application/commands/create-evenement.command.handler'

describe('EvenementsController', () => {
  let createEvenementCommandHandler: StubbedClass<CreateEvenementCommandHandler>
  let app: INestApplication

  before(async () => {
    createEvenementCommandHandler = stubClass(CreateEvenementCommandHandler)

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(CreateEvenementCommandHandler)
      .useValue(createEvenementCommandHandler)
      .compile()

    app = testingModule.createNestApplication()
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('POST /evenements', () => {
    ensureUserAuthenticationFailsIfInvalid('post', '/evenements')
  })
})
