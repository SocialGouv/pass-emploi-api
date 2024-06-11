import {
  CreateEvaluationCommand,
  CreateEvaluationCommandHandler
} from '../../../../src/application/commands/campagne/create-evaluation.command.handler'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import { Campagne } from '../../../../src/domain/campagne'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { JeuneAuthorizer } from '../../../../src/application/authorizers/jeune-authorizer'
import { SinonSandbox } from 'sinon'
import { unJeune } from '../../../fixtures/jeune.fixture'
import {
  uneCampagne,
  uneEvaluationComplete
} from '../../../fixtures/campagne.fixture'
import {
  failure,
  isSuccess,
  success
} from '../../../../src/building-blocks/types/result'
import { ReponsesCampagneInvalide } from '../../../../src/building-blocks/types/domain-error'
import { unUtilisateurJeune } from '../../../fixtures/authentification.fixture'

describe('CreateEvaluationCommandHandler', () => {
  const sandbox: SinonSandbox = createSandbox()
  let campagneFactory: StubbedClass<Campagne.Factory>
  let campagneRepository: StubbedType<Campagne.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let createEvaluationCommandHandler: CreateEvaluationCommandHandler

  beforeEach(() => {
    campagneFactory = stubClass(Campagne.Factory)
    campagneRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    createEvaluationCommandHandler = new CreateEvaluationCommandHandler(
      campagneFactory,
      campagneRepository,
      jeuneRepository,
      jeuneAuthorizer
    )
  })

  describe('handle', () => {
    const jeune = unJeune()
    const campagne = uneCampagne()
    const evaluation = uneEvaluationComplete()
    const command: CreateEvaluationCommand = {
      idJeune: jeune.id,
      reponses: [],
      idCampagne: campagne.id
    }
    describe("quand c'est valide", () => {
      it("sauvegarde l'évaluation", async () => {
        // Given
        campagneRepository.get.withArgs(campagne.id).resolves(campagne)
        jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
        campagneFactory.construireEvaluation
          .withArgs(campagne, jeune, command.reponses)
          .returns(success(evaluation))

        // When
        const result = await createEvaluationCommandHandler.handle(command)

        // Then
        expect(isSuccess(result)).to.be.true()
        expect(
          campagneRepository.saveEvaluation
        ).to.have.been.calledWithExactly(evaluation)
      })
    })

    describe("quand c'est invalide", () => {
      it('renvoie la failure', async () => {
        // Given
        campagneRepository.get.withArgs(campagne.id).resolves(campagne)
        jeuneRepository.get.withArgs(jeune.id).resolves(jeune)
        campagneFactory.construireEvaluation
          .withArgs(campagne, jeune, command.reponses)
          .returns(failure(new ReponsesCampagneInvalide()))

        // When
        const result = await createEvaluationCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(failure(new ReponsesCampagneInvalide()))
      })
    })
  })

  describe('authorize', () => {
    it('valide le jeune', async () => {
      // Given
      const command: CreateEvaluationCommand = {
        idJeune: 'jeune.id',
        reponses: [],
        idCampagne: 'campagne.id'
      }

      // When
      await createEvaluationCommandHandler.authorize(
        command,
        unUtilisateurJeune()
      )

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        command.idJeune,
        unUtilisateurJeune()
      )
    })
  })
})
