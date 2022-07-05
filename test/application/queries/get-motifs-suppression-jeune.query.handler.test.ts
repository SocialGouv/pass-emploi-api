import { expect } from 'chai'
import { success } from '../../../src/building-blocks/types/result'
import { GetMotifsSuppressionJeuneQueryHandler } from '../../../src/application/queries/get-motifs-suppression-jeune.query.handler'
import { SinonSandbox } from 'sinon'
import { createSandbox } from '../../utils'
import { unUtilisateurQueryModel } from '../../fixtures/query-models/authentification.query-model.fixtures'

describe('GetMotifsSuppressionJeuneQueryHandler', () => {
  let getMotifsSuppressionJeuneQueryHandler: GetMotifsSuppressionJeuneQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    getMotifsSuppressionJeuneQueryHandler =
      new GetMotifsSuppressionJeuneQueryHandler()
  })

  after(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('renvoie la liste des motifs', async () => {
      // Given - When
      const result = await getMotifsSuppressionJeuneQueryHandler.handle(
        unUtilisateurQueryModel()
      )

      // Then
      expect(result).to.deep.equal(
        success([
          'Sortie positive du CEJ',
          'Radiation du CEJ',
          "Recréation d'un compte jeune",
          'Autre'
        ])
      )
    })
  })
})
