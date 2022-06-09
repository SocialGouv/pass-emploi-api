import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { ResumeActionsDuJeuneQueryModel } from 'src/application/queries/query-models/jeunes.query-model'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import {
  GetResumeActionsDesJeunesDuConseillerQuery,
  GetResumeActionsDesJeunesDuConseillerQueryHandler
} from '../../../src/application/queries/get-resume-actions-des-jeunes-du-conseiller.query.handler'
import { Jeune } from '../../../src/domain/jeune'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unResumeActionDUnJeune } from '../../fixtures/query-models/jeunes.query-model.fixtures'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetResumeActionsDesJeunesDuConseillerQueryHandler', () => {
  let jeuneRepository: StubbedType<Jeune.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getResumeActionsDesJeunesDuConseillerQueryHandler: GetResumeActionsDesJeunesDuConseillerQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    getResumeActionsDesJeunesDuConseillerQueryHandler =
      new GetResumeActionsDesJeunesDuConseillerQueryHandler(
        jeuneRepository,
        conseillerAuthorizer
      )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
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
        await getResumeActionsDesJeunesDuConseillerQueryHandler.handle(
          getConseillerEtSesJeunesQuery
        )

      // Then
      expect(actual).to.deep.equal(resumeActionsDesJeunes)
    })
  })

  describe('authorize', () => {
    it('valide le conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      const query: GetResumeActionsDesJeunesDuConseillerQuery = {
        idConseiller: utilisateur.id
      }

      // When
      await getResumeActionsDesJeunesDuConseillerQueryHandler.authorize(
        query,
        utilisateur
      )

      // Then
      expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
        utilisateur.id,
        utilisateur
      )
    })
  })
})
