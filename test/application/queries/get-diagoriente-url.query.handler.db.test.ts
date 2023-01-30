import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import {
  GetDiagorienteUrlQuery,
  GetDiagorienteUrlQueryHandler,
  TypeUrlDiagoriente
} from '../../../src/application/queries/get-diagoriente-url.query.handler.db'
import { MauvaiseCommandeError } from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { DiagorienteClient } from '../../../src/infrastructure/clients/diagoriente-client'
import { unJeune } from '../../fixtures/jeune.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetDiagorienteUrlQueryHandler', () => {
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let jeunesRepository: StubbedType<Jeune.Repository>
  let diagorienteClient: StubbedClass<DiagorienteClient>
  let handler: GetDiagorienteUrlQueryHandler
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
    jeunesRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    diagorienteClient = stubClass(DiagorienteClient)

    handler = new GetDiagorienteUrlQueryHandler(
      jeuneAuthorizer,
      jeunesRepository,
      diagorienteClient
    )
  })
  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    describe('jeune sans email', () => {
      it('renvoie failure', async () => {
        // Given
        const jeune = unJeune({ email: undefined })
        const query: GetDiagorienteUrlQuery = {
          idJeune: 'test',
          typeUrl: TypeUrlDiagoriente.FAVORIS
        }
        jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)

        // When
        const result = await handler.handle(query)

        // Then
        expect(result).to.deep.equal(
          failure(new MauvaiseCommandeError('Jeune sans email'))
        )
        expect(diagorienteClient.getUrl).not.to.have.been.called()
      })
    })
    describe('jeune avec email', () => {
      it("renvoie l'url diagoriente du CHATBOT", async () => {
        // Given
        const jeune = unJeune()
        const query: GetDiagorienteUrlQuery = {
          idJeune: 'test',
          typeUrl: TypeUrlDiagoriente.CHATBOT
        }
        jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
        diagorienteClient.getUrl.resolves(success('url'))

        // When
        const result = await handler.handle(query)

        // Then
        expect(diagorienteClient.getUrl).to.have.been.calledOnceWithExactly(
          query.typeUrl,
          {
            id: jeune.id,
            email: jeune.email,
            prenom: jeune.firstName,
            nom: jeune.lastName
          }
        )
        expect(result).to.deep.equal(success({ url: 'url' }))
      })
    })
  })
})
