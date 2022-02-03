import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  GetJeunesByConseillerQuery,
  GetJeunesByConseillerQueryHandler
} from 'src/application/queries/get-jeunes-by-conseiller.query.handler'
import { Jeune } from 'src/domain/jeune'
import { unDetailJeuneQueryModel } from 'test/fixtures/query-models/jeunes.query-model.fixtures'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { Conseiller } from '../../../src/domain/conseiller'
import { Core } from '../../../src/domain/core'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetJeunesByConseillerQueryHandler', () => {
  let conseillersRepository: StubbedType<Conseiller.Repository>
  let jeunesRepository: StubbedType<Jeune.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getJeunesByConseillerQueryHandler: GetJeunesByConseillerQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    conseillersRepository = stubInterface(sandbox)
    jeunesRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    getJeunesByConseillerQueryHandler = new GetJeunesByConseillerQueryHandler(
      conseillersRepository,
      jeunesRepository,
      conseillerAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    const idConseiller = 'idConseiller'
    const getJeunesByConseillerQuery: GetJeunesByConseillerQuery = {
      idConseiller
    }
    beforeEach(async () => {
      conseillersRepository.get.withArgs(idConseiller).resolves(
        unConseiller({
          id: idConseiller,
          structure: Core.Structure.POLE_EMPLOI
        })
      )

      jeunesRepository.getAllQueryModelsByConseiller
        .withArgs(idConseiller)
        .resolves([
          { ...unDetailJeuneQueryModel(), lastActivity: 'date-engagement' }
        ])
    })

    it('retourne un tableau de jeunes', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller({ id: idConseiller })

      // When
      const actual = await getJeunesByConseillerQueryHandler.handle(
        getJeunesByConseillerQuery,
        utilisateur
      )

      // Then
      expect(actual).to.deep.equal(
        success([
          { ...unDetailJeuneQueryModel(), lastActivity: 'date-engagement' }
        ])
      )
    })

    describe("quand le conseiller concerné n'existe pas", () => {
      it('renvoie un échec NonTrouve', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller()

        // When
        const actual = await getJeunesByConseillerQueryHandler.handle(
          { idConseiller: 'un-autre-id' },
          utilisateur
        )

        // Then
        expect(actual).to.deep.equal(
          failure(new NonTrouveError('Conseiller', 'un-autre-id'))
        )
      })
    })

    describe("quand l'utilisateur n'est pas le conseiller concerné", () => {
      it('renvoie un échec DroitsInsuffisants', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({ id: 'au-autre-id' })

        // When
        const actual = await getJeunesByConseillerQueryHandler.handle(
          getJeunesByConseillerQuery,
          utilisateur
        )

        // Then
        expect(actual).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })

    describe("quand l'utilisateur est un superviseur", () => {
      it('retourne les jeunes du conseiller', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({
          id: 'un-autre-id',
          structure: Core.Structure.POLE_EMPLOI,
          roles: [Authentification.Role.SUPERVISEUR]
        })

        // When
        const actual = await getJeunesByConseillerQueryHandler.handle(
          getJeunesByConseillerQuery,
          utilisateur
        )

        // Then
        expect(actual).to.deep.equal(
          success([
            { ...unDetailJeuneQueryModel(), lastActivity: 'date-engagement' }
          ])
        )
      })
    })

    describe("quand l'utilisateur est un superviseur d'une autre structure", () => {
      it('renvoie un échec DroitsInsuffisants', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({
          id: 'un-autre-id',
          structure: Core.Structure.MILO,
          roles: [Authentification.Role.SUPERVISEUR]
        })

        // When
        const actual = await getJeunesByConseillerQueryHandler.handle(
          getJeunesByConseillerQuery,
          utilisateur
        )

        // Then
        expect(actual).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })

  describe('authorize', () => {
    it('autorise un conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      const query: GetJeunesByConseillerQuery = {
        idConseiller: utilisateur.id
      }

      // When
      await getJeunesByConseillerQueryHandler.authorize(query, utilisateur)

      // Then
      expect(
        conseillerAuthorizer.authorizeConseiller
      ).to.have.been.calledWithExactly(utilisateur)
    })
  })
})
