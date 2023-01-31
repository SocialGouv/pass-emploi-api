import { expect } from 'chai'
import { SinonSandbox } from 'sinon'
import { createSandbox } from 'test/utils'
import { GetActionsPredefiniesQueryHandler } from '../../../../src/application/queries/action/get-actions-predefinies.query.handler'

describe('GetActionsPredefiniesQueryHandler', () => {
  let getActionsPredefiniesQueryHandler: GetActionsPredefiniesQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    getActionsPredefiniesQueryHandler = new GetActionsPredefiniesQueryHandler()
  })

  after(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('renvoie la liste des types de qualifications', async () => {
      // Given - When
      const result = await getActionsPredefiniesQueryHandler.handle({})

      // Then
      expect(result).to.deep.equal([
        {
          id: 'action-predefinie-1',
          titre: 'Identifier ses atouts et ses compétences'
        },
        {
          id: 'action-predefinie-2',
          titre: 'Identifier des pistes de métier'
        },
        { id: 'action-predefinie-3', titre: 'Identifier des entreprises' },
        {
          id: 'action-predefinie-4',
          titre:
            "Contacter un employeur pour effectuer une période d'immersion en entreprise"
        },
        { id: 'action-predefinie-5', titre: 'Effectuer une enquête métier' },
        {
          id: 'action-predefinie-6',
          titre: 'Participer à un salon / un forum'
        },
        { id: 'action-predefinie-7', titre: "S'informer sur une formation" },
        {
          id: 'action-predefinie-8',
          titre: 'Contacter un organisme de formation'
        },
        {
          id: 'action-predefinie-9',
          titre: 'Ouvrir son compte personnel de formation'
        },
        { id: 'action-predefinie-10', titre: 'Mettre à jour son CV' },
        {
          id: 'action-predefinie-11',
          titre: 'Rédiger une lettre de motivation'
        },
        {
          id: 'action-predefinie-12',
          titre: "Consulter les offres d'emploi"
        },
        {
          id: 'action-predefinie-13',
          titre: "Répondre à une offre d'emploi"
        },
        {
          id: 'action-predefinie-14',
          titre: 'Effectuer des candidatures spontanées'
        },
        {
          id: 'action-predefinie-15',
          titre: 'Tenir un tableau de prospection'
        },
        {
          id: 'action-predefinie-16',
          titre: "Se rendre à un entretien d'embauche"
        },
        {
          id: 'action-predefinie-17',
          titre:
            'Rechercher des informations pour créer ou reprendre une entreprise'
        },
        { id: 'action-predefinie-18', titre: 'Contacter la mission locale' },
        {
          id: 'action-predefinie-19',
          titre:
            'Contacter un organisme de prestations sociales (ex CAF, CPAM, MSA)'
        },
        {
          id: 'action-predefinie-20',
          titre: "S'informer pour une mobilité à l'étranger"
        }
      ])
    })
  })
})
