import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/authorize-conseiller'
import {
  GetJeuneMiloByDossierQuery,
  GetJeuneMiloByDossierQueryHandler
} from 'src/application/queries/get-jeune-milo-by-dossier.query.handler'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import { Jeune } from 'src/domain/jeune'
import { unDetailJeuneQueryModel } from 'test/fixtures/query-models/jeunes.query-model.fixtures'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetJeuneMiloByDossierQueryHandler', () => {
  let jeunesRepository: StubbedType<Jeune.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getJeuneMiloByDossierQueryHandler: GetJeuneMiloByDossierQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    jeunesRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    getJeuneMiloByDossierQueryHandler = new GetJeuneMiloByDossierQueryHandler(
      jeunesRepository,
      conseillerAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('retourne le jeune', async () => {
      // Given
      const idDossier = '1X'
      const idConseiller = '1'
      const getJeuneMiloByDossierQuery: GetJeuneMiloByDossierQuery = {
        idDossier
      }

      jeunesRepository.getJeuneQueryModelByIdDossier
        .withArgs(idDossier, idConseiller)
        .resolves(unDetailJeuneQueryModel())

      // When
      const actual = await getJeuneMiloByDossierQueryHandler.handle(
        getJeuneMiloByDossierQuery,
        unUtilisateurConseiller({ id: idConseiller })
      )

      // Then
      expect(actual).to.deep.equal(success(unDetailJeuneQueryModel()))
    })
    it('retourne une failure', async () => {
      // Given
      const idDossier = '1X'
      const idConseiller = '1'
      const getJeuneMiloByDossierQuery: GetJeuneMiloByDossierQuery = {
        idDossier
      }

      jeunesRepository.getJeuneQueryModelByIdDossier
        .withArgs(idDossier, idConseiller)
        .resolves(undefined)

      // When
      const actual = await getJeuneMiloByDossierQueryHandler.handle(
        getJeuneMiloByDossierQuery,
        unUtilisateurConseiller({ id: idConseiller })
      )

      // Then
      expect(actual).to.deep.equal(
        failure(new NonTrouveError('Jeune', idDossier))
      )
    })
  })
})
