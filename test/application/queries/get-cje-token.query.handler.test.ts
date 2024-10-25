import { HttpService } from '@nestjs/axios'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import * as CryptoJS from 'crypto-js'
import { SinonSandbox } from 'sinon'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { GetCJETokenQueryHandler } from '../../../src/application/queries/get-cje-token.query.handler'
import { success } from '../../../src/building-blocks/types/result'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { unJeune } from '../../fixtures/jeune.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { testConfig } from '../../utils/module-for-testing'
import * as nock from 'nock'

describe('GetCJETokenQueryHandler', () => {
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let jeunesRepository: StubbedType<Jeune.Repository>
  let handler: GetCJETokenQueryHandler
  let sandbox: SinonSandbox
  const configService = testConfig()

  before(async () => {
    sandbox = createSandbox()
    jeunesRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    const httpService = new HttpService()

    handler = new GetCJETokenQueryHandler(
      jeunesRepository,
      jeuneAuthorizer,
      httpService,
      configService
    )
  })
  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    describe('GET', () => {
      it('renvoie widget token', async () => {
        // Given
        const jeune = unJeune()
        jeunesRepository.get.withArgs(jeune.id).resolves(jeune)
        const hashUserId = CryptoJS.MD5(jeune!.id)
        nock(configService.get('cje')!.apiUrl)
          .post('/widgetTokenGenerator', {
            user_id: hashUserId.toString()
          })
          .reply(200, { data: { widgetToken: 'eyTok' } })

        // When
        const result = await handler.handle({ idJeune: jeune.id })

        // Then
        expect(result).to.deep.equal(success({ widgetToken: 'eyTok' }))
      })
    })
  })
})
