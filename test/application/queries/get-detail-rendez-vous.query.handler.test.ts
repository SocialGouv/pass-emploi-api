import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { RendezVousAuthorizer } from 'src/application/authorizers/authorize-rendezvous'
import { RendezVousQueryModel } from 'src/application/queries/query-models/rendez-vous.query-models'
import { RendezVous } from 'src/domain/rendez-vous'
import { unRendezVousQueryModel } from 'test/fixtures/rendez-vous.fixture'
import {
  GetDetailRendezVousQuery,
  GetDetailRendezVousQueryHandler
} from '../../../src/application/queries/get-detail-rendez-vous.query.handler'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetDetailRendezVousQueryHandler', () => {
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let rendezVousAuthorizer: StubbedClass<RendezVousAuthorizer>
  let getDetailRendezVousQueryHandler: GetDetailRendezVousQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    rendezVousAuthorizer = stubClass(RendezVousAuthorizer)

    getDetailRendezVousQueryHandler = new GetDetailRendezVousQueryHandler(
      rendezVousRepository,
      rendezVousAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it("retourne le détail d'une rendez-vous", async () => {
      // Given
      const idRendezVous = 'idRendezVous'
      const getDetailRendezVousQuery: GetDetailRendezVousQuery = {
        idRendezVous
      }
      const rendezVousQueryModel: RendezVousQueryModel = unRendezVousQueryModel(
        {
          id: idRendezVous
        }
      )
      rendezVousRepository.getQueryModelById
        .withArgs(idRendezVous)
        .resolves(rendezVousQueryModel)

      // When
      const actual = await getDetailRendezVousQueryHandler.handle(
        getDetailRendezVousQuery
      )

      // Then
      expect(actual._isSuccess).to.deep.equal(true)
      if (actual._isSuccess)
        expect(actual.data).to.deep.equal(rendezVousQueryModel)
    })

    it("retourne une failure si l'RendezVous n'existe pas", async () => {
      // Given
      const idRendezVousInexistante = 'idRendezVousInexistante'
      const query: GetDetailRendezVousQuery = {
        idRendezVous: idRendezVousInexistante
      }
      rendezVousRepository.getQueryModelById
        .withArgs(idRendezVousInexistante)
        .resolves()

      // When
      const actual = await getDetailRendezVousQueryHandler.handle(query)

      // Then
      expect(actual._isSuccess).to.equal(false)
    })
  })
})
