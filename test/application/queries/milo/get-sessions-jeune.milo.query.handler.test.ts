import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { unUtilisateurJeune } from 'test/fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { GetSessionsJeuneMiloQueryHandler } from 'src/application/queries/milo/get-sessions-jeune.milo.query.handler'
import { JeuneAuthorizer } from 'src/application/authorizers/jeune-authorizer'
import { failure, success } from 'src/building-blocks/types/result'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { GetSessionsJeuneMiloQueryGetter } from 'src/application/queries/query-getters/milo/get-sessions-jeune.milo.query.getter.db'
import { uneSessionJeuneMiloQueryModel } from 'test/fixtures/sessions.fixture'

describe('GetSessionsJeuneMiloQueryHandler', () => {
  const query = { idJeune: 'idJeune', token: 'token' }
  const utilisateur = unUtilisateurJeune()

  let getSessionsQueryHandler: GetSessionsJeuneMiloQueryHandler
  let getSessionsQueryGetter: StubbedClass<GetSessionsJeuneMiloQueryGetter>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    getSessionsQueryGetter = stubClass(GetSessionsJeuneMiloQueryGetter)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    getSessionsQueryHandler = new GetSessionsJeuneMiloQueryHandler(
      getSessionsQueryGetter,
      jeuneAuthorizer
    )
  })

  after(() => {
    sandbox.restore()
  })

  describe('authorize', () => {
    it('autorise un jeune Milo', () => {
      // When
      getSessionsQueryHandler.authorize(query, utilisateur)

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        'idJeune',
        utilisateur,
        true
      )
    })
  })

  describe('handle', () => {
    describe('quand le query getter renvoie une failure', () => {
      it('renvoie la même failure ', async () => {
        // Given
        const uneFailure = failure(new NonTrouveError('Jeune', query.idJeune))
        getSessionsQueryGetter.handle.withArgs(query).resolves(uneFailure)

        // When
        const result = await getSessionsQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(uneFailure)
      })
    })

    describe('quand le query getter renvoie un success', () => {
      it('renvoie le même success', async () => {
        // Given
        const unSuccess = success([uneSessionJeuneMiloQueryModel])
        getSessionsQueryGetter.handle.withArgs(query).resolves(unSuccess)

        // When
        const result = await getSessionsQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(unSuccess)
      })
    })
  })
})
