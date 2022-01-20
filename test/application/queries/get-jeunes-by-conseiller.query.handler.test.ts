import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  GetJeunesByConseillerQuery,
  GetJeunesByConseillerQueryHandler
} from 'src/application/queries/get-jeunes-by-conseiller.query.handler'
import { Jeune } from 'src/domain/jeune'
import { unDetailJeuneQueryModel } from 'test/fixtures/query-models/jeunes.query-model.fixtures'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetJeunesByConseillerQueryHandler', () => {
  let jeunesRepository: StubbedType<Jeune.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getJeunesByConseillerQueryHandler: GetJeunesByConseillerQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    jeunesRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    getJeunesByConseillerQueryHandler = new GetJeunesByConseillerQueryHandler(
      jeunesRepository,
      conseillerAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('retourne un tableau de jeunes', async () => {
      // Given
      const idConseiller = 'idConseiller'
      const getJeunesByConseillerQuery: GetJeunesByConseillerQuery = {
        idConseiller
      }

      jeunesRepository.getAllQueryModelsByConseiller
        .withArgs(idConseiller)
        .resolves([
          { ...unDetailJeuneQueryModel(), lastActivity: 'date-engagement' }
        ])

      // When
      const actual = await getJeunesByConseillerQueryHandler.handle(
        getJeunesByConseillerQuery
      )

      // Then
      expect(actual).to.deep.equal([
        { ...unDetailJeuneQueryModel(), lastActivity: 'date-engagement' }
      ])
    })
  })

  describe('authorize', () => {
    it('valide le conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      const query: GetJeunesByConseillerQuery = {
        idConseiller: utilisateur.id
      }

      // When
      await getJeunesByConseillerQueryHandler.authorize(query, utilisateur)

      // Then
      expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
        utilisateur.id,
        utilisateur
      )
    })
  })
})
