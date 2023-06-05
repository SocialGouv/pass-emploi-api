import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../../src/application/authorizers/conseiller-authorizer'
import { GetSessionsMiloQueryHandler } from '../../../../src/application/queries/milo/get-sessions.milo.query.handler'
import { success } from '../../../../src/building-blocks/types/result'
import { ConseillerMilo } from '../../../../src/domain/milo/conseiller.milo'
import { SessionConseillerListeDto } from '../../../../src/infrastructure/clients/dto/milo.dto'
import { MiloClient } from '../../../../src/infrastructure/clients/milo-client'
import { unUtilisateurConseiller } from '../../../fixtures/authentification.fixture'
import { unConseillerMilo } from '../../../fixtures/conseiller-milo.fixture'
import { uneSessionConseillerMiloQueryModel } from '../../../fixtures/sessions.fixture'
import { expect, StubbedClass, stubClass } from '../../../utils'

const sessionConseillerListeDto: SessionConseillerListeDto = {
  page: 1,
  nbSessions: 1,
  sessions: [
    {
      session: {
        id: 1,
        nom: 'Une-session',
        dateHeureDebut: '2020-04-06T10:20:00.000Z',
        dateHeureFin: '2020-04-08T10:20:00.000Z',
        dateMaxInscription: '2020-04-07T10:20:00.000Z',
        animateur: 'Un-animateur',
        lieu: 'Un-lieu',
        nbPlacesDisponibles: 10,
        commentaire: 'Un-commentaire'
      },
      offre: {
        id: 1,
        nom: 'Une-offre',
        theme: 'Un-theme',
        type: 'WORKSHOP',
        description: 'Une-Desc',
        nomPartenaire: 'Un-partenaire'
      }
    }
  ]
}

describe('GetSessionsQueryHandler', () => {
  let getSessionsQueryHandler: GetSessionsMiloQueryHandler
  let miloClient: StubbedClass<MiloClient>
  let conseillerRepository: StubbedType<ConseillerMilo.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    miloClient = stubClass(MiloClient)
    conseillerRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    getSessionsQueryHandler = new GetSessionsMiloQueryHandler(
      miloClient,
      conseillerRepository,
      conseillerAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('authorize', () => {
    it('autorise un conseiller Milo', () => {
      // When
      const query = {
        idConseiller: 'idConseiller',
        token: 'bearer un-token'
      }
      getSessionsQueryHandler.authorize(query, unUtilisateurConseiller())

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(
        'idConseiller',
        unUtilisateurConseiller(),
        true
      )
    })
  })
  describe('handle', () => {
    it('Récupère la liste des sessions de sa structure MILO', async () => {
      // Given
      conseillerRepository.get
        .withArgs('idConseiller-1')
        .resolves(unConseillerMilo())
      miloClient.getSessionsConseiller
        .withArgs('bearer un-token', unConseillerMilo().idStructure)
        .resolves(success(sessionConseillerListeDto))
      const query = {
        idConseiller: 'idConseiller-1',
        token: 'bearer un-token'
      }

      // When
      const result = await getSessionsQueryHandler.handle(query)

      // Then
      expect(result).to.deep.equal({
        _isSuccess: true,
        data: [uneSessionConseillerMiloQueryModel()]
      })
    })
  })
})
