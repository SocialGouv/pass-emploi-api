import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import {
  GetDossierMiloJeuneQuery,
  GetDossierMiloJeuneQueryHandler
} from '../../../src/application/queries/get-dossier-milo-jeune.query.handler'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unDossierMilo } from '../../fixtures/milo.fixture'
import { createSandbox, expect } from '../../utils'
import { MiloJeune } from '../../../src/domain/partenaire/milo/milo.jeune'

describe('GetDossierMiloJeuneQueryHandler', () => {
  let miloRepository: StubbedType<MiloJeune.Repository>
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
      const getDossierMiloJeuneQuery: GetDossierMiloJeuneQuery = {
        idDossier
      }

      miloRepository.getDossier.withArgs(idDossier).resolves(unDossierMilo())

      // When
      const actual = await getDossierMiloJeuneQueryHandler.handle(
        getDossierMiloJeuneQuery
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
      const result = await getDossierMiloJeuneQueryHandler.authorize(
        query,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
    it("rejette quand c'est un jeune", async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      const query: GetDossierMiloJeuneQuery = {
        idDossier: '1'
      }

      // When
      const result = await getDossierMiloJeuneQueryHandler.authorize(
        query,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })
})
