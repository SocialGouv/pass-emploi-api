import { SinonSandbox } from 'sinon'
import {
  GetDiagorienteMetiersFavorisQuery,
  GetDiagorienteMetiersFavorisQueryHandler
} from 'src/application/queries/get-diagoriente-metiers-favoris.query.handler'
import { success } from 'src/building-blocks/types/result'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { DiagorienteClient } from '../../../src/infrastructure/clients/diagoriente-client'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetDiagorienteMetiersFavorisQueryHandler', () => {
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let diagorienteClient: StubbedClass<DiagorienteClient>
  let handler: GetDiagorienteMetiersFavorisQueryHandler
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    diagorienteClient = stubClass(DiagorienteClient)

    handler = new GetDiagorienteMetiersFavorisQueryHandler(
      jeuneAuthorizer,
      diagorienteClient
    )
  })
  afterEach(() => {
    sandbox.restore()
  })

  describe('idJeune', () => {
    it('renvoie les métiers favoris diagoriente', async () => {
      // Given
      const query: GetDiagorienteMetiersFavorisQuery = {
        idJeune: 'test'
      }

      diagorienteClient.getMetiersFavoris.withArgs(query.idJeune).resolves(
        success({
          data: {
            userByPartner: {
              favorites: [
                {
                  tag: {
                    code: 'string',
                    id: 'string',
                    title: 'string'
                  },
                  id: 'string',
                  favorited: true
                }
              ]
            }
          }
        })
      )

      // When
      const result = await handler.handle(query)

      // Then
      expect(diagorienteClient.getMetiersFavoris).to.have.been.calledOnce()
      expect(result).to.deep.equal(
        success({
          aDesMetiersFavoris: true,
          metiersFavoris: [
            {
              rome: 'string',
              titre: 'string'
            }
          ]
        })
      )
    })
  })
})
