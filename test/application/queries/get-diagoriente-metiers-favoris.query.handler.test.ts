import { SinonSandbox } from 'sinon'
import {
  GetDiagorienteMetiersFavorisQuery,
  GetDiagorienteMetiersFavorisQueryHandler
} from 'src/application/queries/get-diagoriente-metiers-favoris.query.handler'
import { failure, success } from 'src/building-blocks/types/result'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import { DiagorienteClient } from '../../../src/infrastructure/clients/diagoriente-client'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetDiagorienteMetiersFavorisQueryHandler', () => {
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let diagorienteClient: StubbedClass<DiagorienteClient>
  let handler: GetDiagorienteMetiersFavorisQueryHandler
  let sandbox: SinonSandbox

  beforeEach(async () => {
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

  describe('quand la recuperation des metiers favoris est en succes', () => {
    it('renvoie les métiers favoris', async () => {
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
    it('renvoie aDesMetiersFavoris false', async () => {
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
                  favorited: false
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
          aDesMetiersFavoris: false,
          metiersFavoris: []
        })
      )
    })
    it("renvoie uniquement le booleen quand le detail n'est pas demandé", async () => {
      // Given
      const query: GetDiagorienteMetiersFavorisQuery = {
        idJeune: 'test',
        detail: false
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
          metiersFavoris: undefined
        })
      )
    })
  })
  describe('quand la recuperation des metiers favoris est en failure', () => {
    it('renvoie la failure', async () => {
      // Given
      const query: GetDiagorienteMetiersFavorisQuery = {
        idJeune: 'test'
      }
      diagorienteClient.getMetiersFavoris
        .withArgs(query.idJeune)
        .resolves(failure(new ErreurHttp('Erreur Diago', 429)))

      // When
      const result = await handler.handle(query)

      // Then
      expect(diagorienteClient.getMetiersFavoris).to.have.been.calledOnce()
      expect(result).to.deep.equal(failure(new ErreurHttp('Erreur Diago', 429)))
    })
  })
})
