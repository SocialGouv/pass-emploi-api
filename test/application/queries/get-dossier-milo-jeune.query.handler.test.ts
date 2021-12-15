import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  GetDossierMiloJeuneQuery,
  GetDossierMiloJeuneQueryHandler
} from '../../../src/application/queries/get-dossier-milo-jeune.query.handler'
import { Unauthorized } from '../../../src/domain/erreur'
import { Milo } from '../../../src/domain/milo'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unDossierMilo } from '../../fixtures/milo.fixture'
import { createSandbox, expect } from '../../utils'

describe('GetDossierMiloJeuneQueryHandler', () => {
  let miloRepository: StubbedType<Milo.Repository>
  let getDossierMiloJeuneQueryHandler: GetDossierMiloJeuneQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    miloRepository = stubInterface(sandbox)

    getDossierMiloJeuneQueryHandler = new GetDossierMiloJeuneQueryHandler(
      miloRepository
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('retourne le dossier', async () => {
      // Given
      const idDossier = '1'
      const getDetailActionQuery: GetDossierMiloJeuneQuery = {
        idDossier
      }

      miloRepository.getDossier.withArgs(idDossier).resolves(unDossierMilo())

      // When
      const actual = await getDossierMiloJeuneQueryHandler.handle(
        getDetailActionQuery
      )

      // Then
      expect(actual).to.deep.equal(unDossierMilo())
    })
  })

  describe('authorize', () => {
    it("valide quand c'est un conseiller MILO", async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      const query: GetDossierMiloJeuneQuery = {
        idDossier: '1'
      }

      // When
      const rejected = await getDossierMiloJeuneQueryHandler.authorize(
        query,
        utilisateur
      )

      // Then
      expect(rejected).to.be.equal(undefined)
    })
    it("rejette quand c'est un jeune", async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      const query: GetDossierMiloJeuneQuery = {
        idDossier: '1'
      }

      // When
      const rejected = getDossierMiloJeuneQueryHandler.authorize(
        query,
        utilisateur
      )

      // Then
      await expect(rejected).to.be.rejectedWith(Unauthorized)
    })
  })
})
