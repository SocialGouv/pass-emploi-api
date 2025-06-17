import { expect } from 'chai'
import { SinonSandbox } from 'sinon'
import { GetTypesQualificationsQueryHandler } from 'src/application/queries/action/get-types-qualifications.query.handler'
import { Action } from 'src/domain/action/action'
import { createSandbox } from '../../../utils'

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
          code: Action.Qualification.Code.SANTE,
          label: 'Santé',
          heures: 2
        },
        {
          code: Action.Qualification.Code.PROJET_PROFESSIONNEL,
          label: 'Projet Professionnel',
          heures: 2
        },
        {
          code: Action.Qualification.Code.LOGEMENT,
          label: 'Logement',
          heures: 2
        },
        {
          code: Action.Qualification.Code.CITOYENNETE,
          label: 'Citoyenneté',
          heures: 2
        },
        {
          code: Action.Qualification.Code.EMPLOI,
          label: 'Emploi',
          heures: 3
        },
        {
          code: Action.Qualification.Code.CULTURE_SPORT_LOISIRS,
          label: 'Loisir, sport, culture',
          heures: 2
        },
        {
          code: Action.Qualification.Code.FORMATION,
          label: 'Formation',
          heures: 3
        },
        {
          code: Action.Qualification.Code.NON_SNP,
          label: 'Action non SNP',
          heures: 0
        }
      ])
    })
  })
})
