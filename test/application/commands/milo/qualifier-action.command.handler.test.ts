import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { ActionAuthorizer } from '../../../../src/application/authorizers/action-authorizer'
import {
  QualifierActionCommand,
  QualifierActionCommandHandler
} from '../../../../src/application/commands/milo/qualifier-action.command.handler'
import {
  ErreurHttp,
  NonTrouveError
} from '../../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../../src/building-blocks/types/result'
import { Action } from '../../../../src/domain/action/action'
import { uneAction, uneActionTerminee } from '../../../fixtures/action.fixture'
import {
  unUtilisateurConseiller,
  unUtilisateurDecode,
  unUtilisateurJeune
} from '../../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { Evenement, EvenementService } from '../../../../src/domain/evenement'
import { uneDatetime } from '../../../fixtures/date.fixture'
import { ActionMilo } from '../../../../src/domain/milo/action.milo'

describe('QualifierActionCommandHandler', () => {
  let actionRepository: StubbedType<Action.Repository>
  let actionMiloRepository: StubbedType<ActionMilo.Repository>
  let actionAuthorizer: StubbedClass<ActionAuthorizer>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let evenementService: StubbedClass<EvenementService>
  let qualifierActionCommandHandler: QualifierActionCommandHandler

  const idAction = '35399853-f224-4910-8d02-44fb1ac85606'
  const utilisateurConseiller = unUtilisateurConseiller({ username: 'j.doe' })

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    actionRepository = stubInterface(sandbox)
    actionMiloRepository = stubInterface(sandbox)
    actionAuthorizer = stubClass(ActionAuthorizer)
    jeuneRepository = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)

    jeuneRepository.get
      .withArgs('ABCDE')
      .resolves(unJeune({ idPartenaire: 'idDossier' }))

    qualifierActionCommandHandler = new QualifierActionCommandHandler(
      actionRepository,
      actionMiloRepository,
      actionAuthorizer,
      jeuneRepository,
      evenementService
    )
  })

  describe('handle', () => {
    describe("Quand l'action existe", () => {
      describe("quand c'est une SNP", () => {
        describe('quand la création de SNP a fonctionné', () => {
          it('qualifie, sauvegarde une action terminée, et crée la SNP', async () => {
            // Given
            const actionTerminee: Action.Terminee = uneActionTerminee({
              id: idAction
            })
            const commentaireQualification = 'Un commentaire'
            const actionQualifiee: Action.Qualifiee = {
              ...actionTerminee,
              dateDebut: actionTerminee.dateFinReelle,
              qualification: {
                code: Action.Qualification.Code.SANTE,
                heures: 2,
                commentaire: commentaireQualification
              }
            }
            const actionMilo: ActionMilo = {
              ...actionQualifiee,
              idDossier: 'idDossier',
              loginConseiller: 'j.doe'
            }
            actionRepository.get.withArgs(idAction).resolves(actionTerminee)
            actionMiloRepository.save.resolves(emptySuccess())

            // When
            const command: QualifierActionCommand = {
              idAction: idAction,
              utilisateur: utilisateurConseiller,
              codeQualification: Action.Qualification.Code.SANTE,
              commentaireQualification: commentaireQualification
            }
            const result = await qualifierActionCommandHandler.handle(command)

            // Then
            expect(actionRepository.save).to.have.been.calledWithExactly(
              actionQualifiee
            )
            expect(actionMiloRepository.save).to.have.been.calledWithExactly(
              actionMilo
            )
            expect(result).to.deep.equal(
              success({
                code: 'SANTE',
                heures: 2,
                libelle: 'Santé',
                commentaireQualification
              })
            )
          })
        })
        describe('quand la création de SNP a échoué', () => {
          it("ne sauvegarde pas l'action et rejette", async () => {
            // Given
            const actionTerminee = uneAction({
              id: idAction,
              statut: Action.Statut.TERMINEE,
              dateFinReelle: uneDatetime()
            })
            actionRepository.get.withArgs(idAction).resolves(actionTerminee)
            actionMiloRepository.save.resolves(
              failure(new ErreurHttp('KO', 500))
            )

            // When
            const command: QualifierActionCommand = {
              idAction: idAction,
              utilisateur: utilisateurConseiller,
              codeQualification: Action.Qualification.Code.SANTE,
              commentaireQualification: 'Un commentaire'
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
          const actionTerminee = uneAction({
            id: idAction,
            statut: Action.Statut.TERMINEE,
            dateFinReelle: uneDatetime()
          })
          const actionQualifiee: Action.Qualifiee = {
            ...actionTerminee,
            dateDebut: actionTerminee.dateFinReelle!,
            dateFinReelle: uneDatetime(),
            qualification: {
              code: Action.Qualification.Code.NON_SNP,
              heures: 0,
              commentaire: undefined
            }
          }
          actionRepository.get.withArgs(idAction).resolves(actionTerminee)

          // When
          const command: QualifierActionCommand = {
            idAction: idAction,
            utilisateur: utilisateurConseiller,
            codeQualification: Action.Qualification.Code.NON_SNP,
            commentaireQualification: 'Un commentaire'
          }
          const result = await qualifierActionCommandHandler.handle(command)

          // Then
          expect(actionRepository.save).to.have.been.calledWithExactly(
            actionQualifiee
          )
          expect(actionMiloRepository.save).not.to.have.been.called()
          expect(result).to.deep.equal(
            success({
              code: 'NON_SNP',
              heures: 0,
              libelle: 'Action non SNP',
              commentaireQualification: undefined
            })
          )
        })
      })
      it("rejette quand la qualification n'est pas possible", async () => {
        // Given
        const actionEnCours = uneAction({
          id: idAction,
          statut: Action.Statut.EN_COURS
        })
        actionRepository.get.withArgs(idAction).resolves(actionEnCours)

        // When
        const command: QualifierActionCommand = {
          idAction: idAction,
          utilisateur: utilisateurConseiller,
          codeQualification: Action.Qualification.Code.SANTE,
          commentaireQualification: 'Un commentaire'
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
          utilisateur: utilisateurConseiller,
          codeQualification: Action.Qualification.Code.CITOYENNETE,
          commentaireQualification: 'Un commentaire'
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
        utilisateur: utilisateurConseiller,
        codeQualification: Action.Qualification.Code.SANTE,
        commentaireQualification: 'Un commentaire'
      }

      const utilisateur = utilisateurConseiller

      // When
      await qualifierActionCommandHandler.authorize(command, utilisateur)

      // Then
      expect(
        actionAuthorizer.autoriserPourUneAction
      ).to.have.been.calledWithExactly(command.idAction, utilisateur)
    })
    it('rejette un jeune', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      const command: QualifierActionCommand = {
        idAction: 'idAction',
        utilisateur,
        codeQualification: Action.Qualification.Code.SANTE,
        commentaireQualification: 'Un commentaire'
      }

      // When
      const result = await qualifierActionCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(actionAuthorizer.autoriserPourUneAction).not.to.have.been.called()
      expect(result._isSuccess).to.be.false()
    })
  })

  describe('monitor', () => {
    it("monitore la qualification de l'action en SNP", async () => {
      // Given
      const utilisateur = unUtilisateurDecode()
      const command: QualifierActionCommand = {
        idAction: idAction,
        utilisateur: utilisateurConseiller,
        codeQualification: Action.Qualification.Code.SANTE,
        commentaireQualification: 'Un commentaire'
      }
      // When
      await qualifierActionCommandHandler.monitor(utilisateur, command)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.ACTION_QUALIFIEE_SNP,
        utilisateur
      )
    })
    it("monitore la qualification de l'action en NON SNP", async () => {
      // Given
      const utilisateur = unUtilisateurDecode()
      const command: QualifierActionCommand = {
        idAction: idAction,
        utilisateur: utilisateurConseiller,
        codeQualification: Action.Qualification.Code.NON_SNP,
        commentaireQualification: 'Un commentaire'
      }

      // When
      await qualifierActionCommandHandler.monitor(utilisateur, command)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.ACTION_QUALIFIEE_NON_SNP,
        utilisateur
      )
    })
  })
})
