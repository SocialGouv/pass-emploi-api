import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  GetResumeActionsDesJeunesDuConseillerQuery,
  GetResumeActionsDesJeunesDuConseillerQueryHandler
} from '../../../src/application/queries/get-resume-actions-des-jeunes-du-conseiller.query.handler'
import {
  Jeune,
  ResumeActionsDuJeuneQueryModel
} from '../../../src/domain/jeune'
import { unResumeActionDUnJeune } from '../../fixtures/query-models/jeunes.query-model.fixtures'
import { createSandbox, expect } from '../../utils'

describe('GetResumeActionsDesJeunesDuConseillerQueryHandler', () => {
  let jeuneRepository: StubbedType<Jeune.Repository>
  let getResumeActionsDesJeunesDuConseillerQueryHandler: GetResumeActionsDesJeunesDuConseillerQueryHandler
  let sandbox: SinonSandbox
  before(() => {
    sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    getResumeActionsDesJeunesDuConseillerQueryHandler =
      new GetResumeActionsDesJeunesDuConseillerQueryHandler(jeuneRepository)
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('retourne un conseiller et ses jeunes', async () => {
    // Given
    const idConseiller = 'idConseiller'
    const getConseillerEtSesJeunesQuery: GetResumeActionsDesJeunesDuConseillerQuery =
      {
        idConseiller
      }
    const resumeActionsDesJeunes: ResumeActionsDuJeuneQueryModel[] = [
      unResumeActionDUnJeune({ jeuneId: 'ABCDE' }),
      unResumeActionDUnJeune({ jeuneId: 'FGHIJ' })
    ]
    jeuneRepository.getResumeActionsDesJeunesDuConseiller
      .withArgs(idConseiller)
      .resolves(resumeActionsDesJeunes)

    // When
    const actual =
      await getResumeActionsDesJeunesDuConseillerQueryHandler.execute(
        getConseillerEtSesJeunesQuery
      )

    // Then
    expect(actual).to.deep.equal(resumeActionsDesJeunes)
  })
})
