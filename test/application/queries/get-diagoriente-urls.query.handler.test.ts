import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import {
  GetDiagorienteUrlsQuery,
  GetDiagorienteUrlsQueryHandler,
  TypeUrlDiagoriente
} from '../../../src/application/queries/get-diagoriente-urls.query.handler'
import { MauvaiseCommandeError } from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { DiagorienteClient } from '../../../src/infrastructure/clients/diagoriente-client'
import { unJeune } from '../../fixtures/jeune.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetDiagorienteUrlsQueryHandler', () => {
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let jeunesRepository: StubbedType<Jeune.Repository>
  let diagorienteClient: StubbedClass<DiagorienteClient>
  let handler: GetDiagorienteUrlsQueryHandler
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
    jeunesRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    diagorienteClient = stubClass(DiagorienteClient)

    handler = new GetDiagorienteUrlsQueryHandler(
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
        const query: GetDiagorienteUrlsQuery = {
          idJeune: 'test'
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
      it('renvoie les urls diagoriente', async () => {
        // Given
        const jeune = unJeune()
        const infosJeune = {
          id: jeune.id,
          email: jeune.email
        }
        const query: GetDiagorienteUrlsQuery = {
          idJeune: 'test'
        }
        jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
        diagorienteClient.getUrl
          .withArgs(TypeUrlDiagoriente.CHATBOT, infosJeune)
          .resolves(success('urlChat'))
        diagorienteClient.getUrl
          .withArgs(TypeUrlDiagoriente.FAVORIS, infosJeune)
          .resolves(success('urlFavoris'))
        diagorienteClient.getUrl
          .withArgs(TypeUrlDiagoriente.RECOMMANDES, infosJeune)
          .resolves(success('urlReco'))

        // When
        const result = await handler.handle(query)

        // Then
        expect(diagorienteClient.getUrl).to.have.been.calledThrice()
        expect(result).to.deep.equal(
          success({
            urlChatbot: 'urlChat',
            urlFavoris: 'urlFavoris',
            urlRecommandes: 'urlReco'
          })
        )
      })
    })
  })
})
