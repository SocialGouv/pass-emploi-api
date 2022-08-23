import { expect } from 'chai'
import { SinonSandbox } from 'sinon'
import { GetTypesQualificationsQueryHandler } from 'src/application/queries/get-types-qualifications.query.handler'
import { Action } from 'src/domain/action/action'
import { createSandbox } from '../../utils'

describe('GetTypesQualificationsQueryHandler', () => {
  let getTypesQualificationsQueryHandler: GetTypesQualificationsQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    getTypesQualificationsQueryHandler =
      new GetTypesQualificationsQueryHandler()
  })

  after(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('renvoie la liste des types de qualifications', async () => {
      // Given - When
      const result = await getTypesQualificationsQueryHandler.handle({})

      // Then
      expect(result).to.deep.equal([
        {
          code: Action.CodeQualification.SANTE,
          label: 'CEJ - Démarches personnelles santé',
          heures: 2
        },
        {
          code: Action.CodeQualification.PROJET_PROFESSIONNEL,
          label: 'CEJ - Démarches personnelles projet professionnel',
          heures: 2
        },
        {
          code: Action.CodeQualification.LOGEMENT,
          label: 'CEJ - Démarches personnelles logement',
          heures: 2
        },
        {
          code: Action.CodeQualification.CITOYENNETE,
          label: 'CEJ - Démarches personnelles citoyenneté',
          heures: 2
        },
        {
          code: Action.CodeQualification.EMPLOI,
          label: 'CEJ - Démarches personnelles emploi',
          heures: 3
        },
        {
          code: Action.CodeQualification.CULTURE_SPORT_LOISIRS,
          label: 'CEJ - Démarches personnelles loisir, sport, culture',
          heures: 2
        },
        {
          code: Action.CodeQualification.FORMATION,
          label: 'CEJ - Démarches personnelles formation',
          heures: 3
        },
        {
          code: Action.CodeQualification.NON_QUALIFIABLE,
          label: 'Non qualifiable',
          heures: 0
        }
      ])
    })
  })
})
