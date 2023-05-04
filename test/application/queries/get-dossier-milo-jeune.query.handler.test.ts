import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import {
  GetDossierMiloJeuneQuery,
  GetDossierMiloJeuneQueryHandler
} from '../../../src/application/queries/get-dossier-milo-jeune.query.handler'
import { estMilo } from '../../../src/domain/core'
import { JeuneMilo } from '../../../src/domain/jeune/jeune.milo'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unDossierMilo } from '../../fixtures/milo.fixture'
import { StubbedClass, createSandbox, expect, stubClass } from '../../utils'

describe('GetDossierMiloJeuneQueryHandler', () => {
  let miloRepository: StubbedType<JeuneMilo.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getDossierMiloJeuneQueryHandler: GetDossierMiloJeuneQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    miloRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    getDossierMiloJeuneQueryHandler = new GetDossierMiloJeuneQueryHandler(
      miloRepository,
      conseillerAuthorizer
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
    it('autorise tout conseiller MILO', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      const query: GetDossierMiloJeuneQuery = {
        idDossier: '1'
      }

      // When
      await getDossierMiloJeuneQueryHandler.authorize(query, utilisateur)

      // Then
      expect(
        conseillerAuthorizer.autoriserToutConseiller
      ).to.have.been.calledOnceWithExactly(
        utilisateur,
        estMilo(utilisateur.structure)
      )
    })
  })
})
