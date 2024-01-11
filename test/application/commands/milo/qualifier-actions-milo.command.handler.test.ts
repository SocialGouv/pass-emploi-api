import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../../src/application/authorizers/conseiller-authorizer'
import {
  QualifierActionsMiloCommand,
  QualifierActionsMiloCommandHandler
} from '../../../../src/application/commands/milo/qualifier-actions-milo.command.handler'
import {
  DroitsInsuffisants,
  ErreurHttp
} from '../../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../../src/building-blocks/types/result'
import { Action } from '../../../../src/domain/action/action'
import { Evenement, EvenementService } from '../../../../src/domain/evenement'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { ActionMilo } from '../../../../src/domain/milo/action.milo'
import { uneAction, uneActionTerminee } from '../../../fixtures/action.fixture'
import {
  unUtilisateurConseiller,
  unUtilisateurDecode,
  unUtilisateurJeune
} from '../../../fixtures/authentification.fixture'
import { uneDatetime } from '../../../fixtures/date.fixture'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { StubbedClass, createSandbox, expect, stubClass } from '../../../utils'

describe('QualifierActionsMiloCommandHandler', () => {
  let actionRepository: StubbedType<Action.Repository>
  let actionMiloRepository: StubbedType<ActionMilo.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let evenementService: StubbedClass<EvenementService>
  let qualifierActionsMiloCommandHandler: QualifierActionsMiloCommandHandler

  const idAction = '35399853-f224-4910-8d02-44fb1ac85606'
  const utilisateur = unUtilisateurConseiller({ username: 'j.doe' })

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    actionRepository = stubInterface(sandbox)
    actionMiloRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    jeuneRepository = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)

    jeuneRepository.get
      .withArgs('ABCDE')
      .resolves(unJeune({ idPartenaire: 'idDossier' }))

    qualifierActionsMiloCommandHandler = new QualifierActionsMiloCommandHandler(
      actionRepository,
      actionMiloRepository,
      conseillerAuthorizer,
      jeuneRepository,
      evenementService
    )
  })

  describe('getAggregate', () => {
    const idActionExistante = 'test'
    const idActionInexistante = 'non'
    const actionTerminee: Action.Terminee = uneActionTerminee()

    it('retourne uniquement les actions existantes', async () => {
      const command: QualifierActionsMiloCommand = {
        idsActions: [idActionInexistante, idActionExistante],
        codeQualification: Action.Qualification.Code.EMPLOI
      }
      actionRepository.get.withArgs(idActionExistante).resolves(actionTerminee)
      actionRepository.get.withArgs(idActionInexistante).resolves(undefined)

      const aggregate = await qualifierActionsMiloCommandHandler.getAggregate(
        command
      )

      expect(aggregate).to.deep.equal([actionTerminee])
    })
  })

  describe('handle', () => {
    describe('Quand des actions existent', () => {
      describe("quand c'est une SNP", () => {
        it('qualifie, sauvegarde une action terminée, et crée la SNP', async () => {
          // Given
          const actionTerminee: Action.Terminee = uneActionTerminee({
            id: idAction
          })
          const commentaireQualification = 'Un commentaire'
          const actionQualifiee: Action.Qualifiee = {
            ...actionTerminee,
            dateDebut: actionTerminee.dateCreation,
            qualification: {
              code: Action.Qualification.Code.SANTE,
              heures: 2,
              commentaire: commentaireQualification
            }
          }
          jeuneRepository.get
            .withArgs(actionQualifiee.idJeune)
            .resolves(unJeune())
          const actionMilo: ActionMilo = {
            ...actionQualifiee,
            idDossier: '1234',
            loginConseiller: 'j.doe'
          }
          actionMiloRepository.save
            .withArgs(actionMilo)
            .resolves(emptySuccess())

          // When
          const command: QualifierActionsMiloCommand = {
            idsActions: [idAction],
            codeQualification: Action.Qualification.Code.SANTE,
            commentaireQualification: commentaireQualification
          }

          const result = await qualifierActionsMiloCommandHandler.handle(
            command,
            utilisateur,
            [actionTerminee]
          )

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
              commentaireQualification,
              idsActionsQualifiees: [idAction],
              idsActionsEnErreur: []
            })
          )
        })
        it("ne sauvegarde pas l'action quand la SNP échoue", async () => {
          // Given
          const idActionQuiEchoue = 'fail'
          const actionTermineeQuiEchoue: Action.Terminee = uneActionTerminee({
            id: idActionQuiEchoue,
            statut: Action.Statut.TERMINEE,
            dateFinReelle: uneDatetime()
          })
          const actionQualifieeEchoue: Action.Qualifiee = {
            ...actionTermineeQuiEchoue,
            dateDebut: actionTermineeQuiEchoue.dateCreation,
            qualification: {
              code: Action.Qualification.Code.EMPLOI,
              heures: 3
            }
          }
          jeuneRepository.get
            .withArgs(actionQualifieeEchoue.idJeune)
            .resolves(unJeune())

          actionMiloRepository.save.resolves(failure(new ErreurHttp('KO', 500)))

          // When
          const command: QualifierActionsMiloCommand = {
            idsActions: [idActionQuiEchoue, 'actionSansQualif'],
            codeQualification: Action.Qualification.Code.EMPLOI
          }

          const result = await qualifierActionsMiloCommandHandler.handle(
            command,
            utilisateur,
            [actionTermineeQuiEchoue]
          )

          // Then
          expect(actionRepository.save).not.to.have.been.called()
          expect(result).to.deep.equal(
            success({
              code: 'EMPLOI',
              commentaireQualification: undefined,
              heures: undefined,
              libelle: undefined,
              idsActionsQualifiees: [],
              idsActionsEnErreur: [idActionQuiEchoue, 'actionSansQualif']
            })
          )
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
            dateDebut: actionTerminee.dateCreation,
            dateFinReelle: uneDatetime(),
            qualification: {
              code: Action.Qualification.Code.NON_SNP,
              heures: 0,
              commentaire: undefined
            }
          }
          jeuneRepository.get
            .withArgs(actionQualifiee.idJeune)
            .resolves(unJeune())
          actionRepository.get.withArgs(idAction).resolves(actionTerminee)

          // When
          const command: QualifierActionsMiloCommand = {
            idsActions: [idAction],
            codeQualification: Action.Qualification.Code.NON_SNP,
            commentaireQualification: 'Un commentaire'
          }
          const result = await qualifierActionsMiloCommandHandler.handle(
            command,
            utilisateur,
            [actionTerminee]
          )

          // Then
          expect(actionRepository.save).to.have.been.calledWithExactly(
            actionQualifiee
          )
          expect(actionMiloRepository.save).not.to.have.been.called()
          expect(result).to.deep.equal(
            success({
              code: 'NON_SNP',
              heures: 0,
              libelle: 'Action non qualifiée en Situation Non Professionnelle',
              commentaireQualification: undefined,
              idsActionsQualifiees: [idAction],
              idsActionsEnErreur: []
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
        const command: QualifierActionsMiloCommand = {
          idsActions: [idAction],
          codeQualification: Action.Qualification.Code.SANTE,
          commentaireQualification: 'Un commentaire'
        }
        const result = await qualifierActionsMiloCommandHandler.handle(
          command,
          utilisateur,
          [actionEnCours]
        )

        // Then
        expect(actionRepository.save).not.to.have.been.called()
        expect(result).to.deep.equal(
          success({
            code: 'SANTE',
            commentaireQualification: undefined,
            heures: undefined,
            libelle: undefined,
            idsActionsQualifiees: [],
            idsActionsEnErreur: [idAction]
          })
        )
      })
    })

    describe("Quand aucune action n'existe", () => {
      it('renvoie des données vides', async () => {
        // Given
        const command: QualifierActionsMiloCommand = {
          idsActions: ['inexistante'],
          codeQualification: Action.Qualification.Code.EMPLOI
        }

        // When
        const result = await qualifierActionsMiloCommandHandler.handle(
          command,
          utilisateur,
          []
        )

        // Then
        expect(result).to.deep.equal(
          success({
            code: 'EMPLOI',
            commentaireQualification: undefined,
            heures: undefined,
            libelle: undefined,
            idsActionsQualifiees: [],
            idsActionsEnErreur: ['inexistante']
          })
        )
      })
    })
  })

  describe('authorize', () => {
    const actions = [
      uneAction({ idJeune: 'jeune1' }),
      uneAction({ idJeune: 'jeune2' })
    ]
    it('authorise un conseiller à qualifier les actions de ses jeunes', async () => {
      // Given
      const command: QualifierActionsMiloCommand = {
        idsActions: [],
        codeQualification: Action.Qualification.Code.SANTE
      }
      conseillerAuthorizer.autoriserConseillerPourSesJeunes.resolves(
        emptySuccess()
      )

      // When
      const result = await qualifierActionsMiloCommandHandler.authorize(
        command,
        utilisateur,
        actions
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
    it("rejette si une des actions n'est pas autorisée", async () => {
      // Given

      const command: QualifierActionsMiloCommand = {
        idsActions: [],
        codeQualification: Action.Qualification.Code.SANTE
      }

      // When
      const result = await qualifierActionsMiloCommandHandler.authorize(
        command,
        unUtilisateurJeune(),
        actions
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })

  describe('monitor', () => {
    it("monitore la qualification de l'action en SNP et NON SNP", async () => {
      // Given
      const utilisateur = unUtilisateurDecode()
      const command: QualifierActionsMiloCommand = {
        idsActions: ['Action1', 'Action2', 'Action3'],
        codeQualification: Action.Qualification.Code.SANTE,
        commentaireQualification: 'Un commentaire'
      }
      // When
      await qualifierActionsMiloCommandHandler.monitor(utilisateur, command)

      // Then
      expect(evenementService.creer).to.have.been.calledOnceWithExactly(
        Evenement.Code.ACTION_QUALIFIEE_SNP,
        utilisateur
      )
    })
    it("monitore la qualification de l'action en NON SNP", async () => {
      // Given
      const utilisateur = unUtilisateurDecode()
      const command: QualifierActionsMiloCommand = {
        idsActions: ['Action1', 'Action2', 'Action3'],
        codeQualification: Action.Qualification.Code.NON_SNP,
        commentaireQualification: 'Un commentaire'
      }
      // When
      await qualifierActionsMiloCommandHandler.monitor(utilisateur, command)

      // Then
      expect(evenementService.creer).to.have.been.calledOnceWithExactly(
        Evenement.Code.ACTION_QUALIFIEE_NON_SNP,
        utilisateur
      )
    })
  })
})
