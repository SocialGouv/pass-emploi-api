import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  GetDiagorienteMetiersFavorisQuery,
  GetDiagorienteMetiersFavorisQueryHandler
} from 'src/application/queries/get-diagoriente-metiers-favoris.query.handler'
import {
  emptySuccess,
  failure,
  success
} from 'src/building-blocks/types/result'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import {
  CompteDiagorienteInvalideError,
  ErreurHttp,
  MauvaiseCommandeError
} from '../../../src/building-blocks/types/domain-error'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { DiagorienteClient } from '../../../src/infrastructure/clients/diagoriente-client'
import { unJeune } from '../../fixtures/jeune.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetDiagorienteMetiersFavorisQueryHandler', () => {
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let jeunesRepository: StubbedType<Jeune.Repository>
  let diagorienteClient: StubbedClass<DiagorienteClient>
  let handler: GetDiagorienteMetiersFavorisQueryHandler
  let sandbox: SinonSandbox

  beforeEach(async () => {
    sandbox = createSandbox()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    diagorienteClient = stubClass(DiagorienteClient)
    jeunesRepository = stubInterface(sandbox)

    handler = new GetDiagorienteMetiersFavorisQueryHandler(
      jeuneAuthorizer,
      diagorienteClient,
      jeunesRepository
    )
  })
  afterEach(() => {
    sandbox.restore()
  })

  describe('jeune sans email', () => {
    it('renvoie failure', async () => {
      // Given
      const jeune = unJeune({ email: undefined })
      const query: GetDiagorienteMetiersFavorisQuery = {
        idJeune: 'test'
      }
      jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)

      // When
      const result = await handler.handle(query)

      // Then
      expect(result).to.deep.equal(
        failure(new MauvaiseCommandeError('Jeune sans email'))
      )
      expect(diagorienteClient.register).not.to.have.been.called()
      expect(diagorienteClient.getMetiersFavoris).not.to.have.been.called()
    })
  })

  describe('jeune avec email', () => {
    it('register en echec', async () => {
      // Given
      const jeune = unJeune()
      const infosJeune = {
        id: jeune.id,
        email: jeune.email
      }
      const query: GetDiagorienteMetiersFavorisQuery = {
        idJeune: jeune.id
      }
      jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
      diagorienteClient.register
        .withArgs(infosJeune)
        .resolves(failure(new CompteDiagorienteInvalideError(jeune.id)))

      // When
      const result = await handler.handle(query)

      // Then
      expect(result).to.deep.equal(
        failure(new CompteDiagorienteInvalideError(jeune.id))
      )
    })

    describe('register en succes', async () => {
      describe('quand la recuperation des metiers favoris est en succes', () => {
        it('renvoie les métiers favoris', async () => {
          // Given
          const jeune = unJeune()
          const infosJeune = {
            id: jeune.id,
            email: jeune.email
          }
          const query: GetDiagorienteMetiersFavorisQuery = {
            idJeune: jeune.id
          }
          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          diagorienteClient.register
            .withArgs(infosJeune)
            .resolves(emptySuccess())

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
                  code: 'string',
                  libelle: 'string'
                }
              ]
            })
          )
        })
        it('renvoie aDesMetiersFavoris false', async () => {
          // Given
          const jeune = unJeune()
          const infosJeune = {
            id: jeune.id,
            email: jeune.email
          }
          const query: GetDiagorienteMetiersFavorisQuery = {
            idJeune: jeune.id
          }
          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          diagorienteClient.register
            .withArgs(infosJeune)
            .resolves(emptySuccess())

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
          const jeune = unJeune()
          const infosJeune = {
            id: jeune.id,
            email: jeune.email
          }
          const query: GetDiagorienteMetiersFavorisQuery = {
            idJeune: jeune.id,
            detail: false
          }
          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          diagorienteClient.register
            .withArgs(infosJeune)
            .resolves(emptySuccess())

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
          const jeune = unJeune()
          const infosJeune = {
            id: jeune.id,
            email: jeune.email
          }
          const query: GetDiagorienteMetiersFavorisQuery = {
            idJeune: jeune.id
          }
          jeunesRepository.get.withArgs(query.idJeune).resolves(jeune)
          diagorienteClient.register
            .withArgs(infosJeune)
            .resolves(emptySuccess())

          diagorienteClient.getMetiersFavoris
            .withArgs(query.idJeune)
            .resolves(failure(new ErreurHttp('Erreur Diago', 429)))

          // When
          const result = await handler.handle(query)

          // Then
          expect(diagorienteClient.getMetiersFavoris).to.have.been.calledOnce()
          expect(result).to.deep.equal(
            failure(new ErreurHttp('Erreur Diago', 429))
          )
        })
      })
    })
  })
})
