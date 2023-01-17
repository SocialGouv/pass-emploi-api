import { expect } from 'chai'
import { SinonSandbox } from 'sinon'
import { GetMotifsSuppressionJeuneQueryHandler } from '../../../src/application/queries/get-motifs-suppression-jeune.query.handler'
import { success } from '../../../src/building-blocks/types/result'
import { unUtilisateurQueryModel } from '../../fixtures/query-models/authentification.query-model.fixtures'
import { createSandbox } from '../../utils'

describe('GetMotifsSuppressionJeuneQueryHandler', () => {
  let getMotifsSuppressionJeuneQueryHandler: GetMotifsSuppressionJeuneQueryHandler
  let sandbox: SinonSandbox

  beforeEach(() => {
    sandbox = createSandbox()
    getMotifsSuppressionJeuneQueryHandler =
      new GetMotifsSuppressionJeuneQueryHandler()
  })

  afterEach(() => {
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
          {
            motif: 'Emploi durable (plus de 6 mois)',
            description:
              'CDI, CDD de plus de 6 mois dont alternance, titularisation dans la fonction publique'
          },
          { motif: 'Emploi court (moins de 6 mois)', description: undefined },
          { motif: 'Contrat arrivé à échéance', description: undefined },
          {
            motif: 'Limite d’âge atteinte',
            description:
              "Motif valable uniquement à partir de la fin du premier mois des 26 ans. A noter : dans le cas oû le jeune est considéré en tant que travailleur handicapé, l'âge passe à 30 ans."
          },
          {
            motif: 'Demande du jeune de sortir du dispositif',
            description: undefined
          },
          {
            motif: 'Non respect des engagements ou abandon',
            description: undefined
          },
          { motif: 'Déménagement', description: undefined },
          { motif: 'Changement de conseiller', description: undefined },
          { motif: 'Autre', description: 'Champ libre' }
        ])
      )
    })
  })
})
