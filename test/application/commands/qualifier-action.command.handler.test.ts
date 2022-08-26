import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { uneDate } from 'test/fixtures/date.fixture'
import { ActionAuthorizer } from '../../../src/application/authorizers/authorize-action'
import {
  QualifierActionCommand,
  QualifierActionCommandHandler
} from '../../../src/application/commands/qualifier-action.command.handler'
import {
  ErreurHttp,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { Action } from '../../../src/domain/action/action'
import { uneAction } from '../../fixtures/action.fixture'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('QualifierActionCommandHandler', () => {
  let actionRepository: StubbedType<Action.Repository>
  let actionMiloRepository: StubbedType<Action.Milo.Repository>
  let actionAuthorizer: StubbedClass<ActionAuthorizer>
  let qualifierActionCommandHandler: QualifierActionCommandHandler

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    actionRepository = stubInterface(sandbox)
    actionMiloRepository = stubInterface(sandbox)
    actionAuthorizer = stubClass(ActionAuthorizer)
    qualifierActionCommandHandler = new QualifierActionCommandHandler(
      actionRepository,
      actionMiloRepository,
      actionAuthorizer
    )
  })

  describe('handle', () => {
    describe("Quand l'action existe", () => {
      describe("quand c'est une SNP", () => {
        describe('quand la création de SNP a fonctionné', () => {
          it('qualifie, sauvegarde une action terminée, et crée la SNP', async () => {
            // Given
            const idAction = '35399853-f224-4910-8d02-44fb1ac85606'
            const actionTerminee = uneAction({
              id: idAction,
              statut: Action.Statut.TERMINEE,
              dateFinReelle: uneDate()
            })
            const actionQualifiee: Action = {
              ...actionTerminee,
              qualification: {
                code: Action.Qualification.Code.SANTE,
                heures: 2
              }
            }
            actionRepository.get.withArgs(idAction).resolves(actionTerminee)
            actionMiloRepository.save.resolves(emptySuccess())

            // When
            const command: QualifierActionCommand = {
              idAction: idAction,
              utilisateur: unUtilisateurConseiller(),
              codeQualification: Action.Qualification.Code.SANTE
            }
            const result = await qualifierActionCommandHandler.handle(command)

            // Then
            expect(actionRepository.save).to.have.been.calledWithExactly(
              actionQualifiee
            )
            expect(actionMiloRepository.save).to.have.been.calledWithExactly(
              actionQualifiee,
              unUtilisateurConseiller()
            )
            expect(result).to.deep.equal(emptySuccess())
          })
        })
        describe('quand la création de SNP a échoué', () => {
          it("ne sauvegarde pas l'action et rejette", async () => {
            // Given
            const idAction = '35399853-f224-4910-8d02-44fb1ac85606'
            const actionTerminee = uneAction({
              id: idAction,
              statut: Action.Statut.TERMINEE,
              dateFinReelle: uneDate()
            })
            actionRepository.get.withArgs(idAction).resolves(actionTerminee)
            actionMiloRepository.save.resolves(
              failure(new ErreurHttp('KO', 500))
            )

            // When
            const command: QualifierActionCommand = {
              idAction: idAction,
              utilisateur: unUtilisateurConseiller(),
              codeQualification: Action.Qualification.Code.SANTE
            }
            const result = await qualifierActionCommandHandler.handle(command)

            // Then
            expect(result).to.deep.equal(failure(new ErreurHttp('KO', 500)))
          })
        })
      })
      describe("quand ce n'est pas une SNP", () => {
        it('qualifie, sauvegarde une action terminée', async () => {
          // Given
          const idAction = '35399853-f224-4910-8d02-44fb1ac85606'
          const actionTerminee = uneAction({
            id: idAction,
            statut: Action.Statut.TERMINEE,
            dateFinReelle: uneDate()
          })
          const actionQualifiee: Action = {
            ...actionTerminee,
            qualification: {
              code: Action.Qualification.Code.NON_SNP,
              heures: 0
            }
          }
          actionRepository.get.withArgs(idAction).resolves(actionTerminee)

          // When
          const command: QualifierActionCommand = {
            idAction: idAction,
            utilisateur: unUtilisateurConseiller(),
            codeQualification: Action.Qualification.Code.NON_SNP
          }
          const result = await qualifierActionCommandHandler.handle(command)

          // Then
          expect(actionRepository.save).to.have.been.calledWithExactly(
            actionQualifiee
          )
          expect(actionMiloRepository.save).not.to.have.been.called()
          expect(result).to.deep.equal(emptySuccess())
        })
      })
      it("rejette quand la qualification n'est pas possible", async () => {
        // Given
        const idAction = '35399853-f224-4910-8d02-44fb1ac85606'
        const actionEnCours = uneAction({
          id: idAction,
          statut: Action.Statut.EN_COURS
        })
        actionRepository.get.withArgs(idAction).resolves(actionEnCours)

        // When
        const command: QualifierActionCommand = {
          idAction: idAction,
          utilisateur: unUtilisateurConseiller(),
          codeQualification: Action.Qualification.Code.SANTE
        }
        const result = await qualifierActionCommandHandler.handle(command)

        // Then
        expect(actionRepository.save).not.to.have.been.called()
        expect(result._isSuccess).to.be.false()
      })
    })

    describe("Quand l'action n'existe pas", () => {
      it('renvoie une failure', async () => {
        // Given
        const idAction = 'id-action-inexistante'
        actionRepository.get.withArgs(idAction).resolves(undefined)

        // When
        const result = await qualifierActionCommandHandler.handle({
          idAction,
          utilisateur: unUtilisateurConseiller(),
          codeQualification: Action.Qualification.Code.CITOYENNETE
        })

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Action', idAction))
        )
      })
    })
  })

  describe('authorize', () => {
    it('authorise un conseiller à qualifier une action', async () => {
      // Given
      const command: QualifierActionCommand = {
        idAction: 'idAction',
        utilisateur: unUtilisateurConseiller(),
        codeQualification: Action.Qualification.Code.SANTE
      }

      const utilisateur = unUtilisateurConseiller()

      // When
      await qualifierActionCommandHandler.authorize(command, utilisateur)

      // Then
      expect(actionAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idAction,
        utilisateur
      )
    })
    it('rejette un jeune', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      const command: QualifierActionCommand = {
        idAction: 'idAction',
        utilisateur,
        codeQualification: Action.Qualification.Code.SANTE
      }

      // When
      const result = await qualifierActionCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(actionAuthorizer.authorize).not.to.have.been.called()
      expect(result._isSuccess).to.be.false()
    })
  })
})
