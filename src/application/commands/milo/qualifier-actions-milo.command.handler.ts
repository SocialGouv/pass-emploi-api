import { Inject, Injectable } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { DateTime } from 'luxon'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure,
  isFailure,
  success
} from '../../../building-blocks/types/result'
import { Action, ActionRepositoryToken } from '../../../domain/action/action'
import { Qualification } from '../../../domain/action/qualification'
import { Authentification } from '../../../domain/authentification'
import { estMilo } from '../../../domain/core'
import { Evenement, EvenementService } from '../../../domain/evenement'
import { Jeune, JeuneRepositoryToken } from '../../../domain/jeune/jeune'
import {
  ActionMilo,
  ActionMiloRepositoryToken
} from '../../../domain/milo/action.milo'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'

export class QualificationActionsMiloQueryModel {
  @ApiProperty({ isArray: true, type: String })
  idsActionsEnErreur: string[]
}

export interface QualifierActionsMiloCommand extends Command {
  qualifications: Array<{
    idAction: string
    codeQualification: Qualification.Code
    commentaireQualification?: string
    dateDebut?: DateTime
    dateFinReelle?: DateTime
  }>
}

@Injectable()
export class QualifierActionsMiloCommandHandler extends CommandHandler<
  QualifierActionsMiloCommand,
  QualificationActionsMiloQueryModel,
  Action[]
> {
  constructor(
    @Inject(ActionRepositoryToken)
    private readonly actionRepository: Action.Repository,
    @Inject(ActionMiloRepositoryToken)
    private readonly actionMiloRepository: ActionMilo.Repository,
    private readonly conseillerAuthorizer: ConseillerAuthorizer,
    @Inject(JeuneRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    private readonly evenementService: EvenementService
  ) {
    super('QualifierActionsMiloCommandHandler')
  }

  async getAggregate(command: QualifierActionsMiloCommand): Promise<Action[]> {
    const idsActions = command.qualifications.map(
      qualification => qualification.idAction
    )
    return this.actionRepository.findAll(idsActions)
  }

  async handle(
    command: QualifierActionsMiloCommand,
    utilisateur: Authentification.Utilisateur,
    actions: Action[]
  ): Promise<Result<QualificationActionsMiloQueryModel>> {
    const idsActionsEnErreur: string[] = []

    for (const qualification of command.qualifications) {
      const action = actions.find(
        actionTrouvee => qualification.idAction === actionTrouvee.id
      )

      if (!action) {
        idsActionsEnErreur.push(qualification.idAction)
        continue
      }
      const qualifierResult = Action.qualifier(
        action,
        qualification.codeQualification,
        qualification.commentaireQualification,
        qualification.dateDebut,
        qualification.dateFinReelle
      )

      if (isFailure(qualifierResult)) {
        idsActionsEnErreur.push(action.id)
        this.logger.warn(qualifierResult.error.message)
        continue
      }
      const actionQualifiee: Action.Qualifiee = qualifierResult.data

      const estSNP =
        actionQualifiee.qualification.code !== Qualification.Code.NON_SNP

      if (estSNP) {
        const resultQualificationEnSNP = await qualifierEnSNP(
          actionQualifiee,
          utilisateur,
          this.actionMiloRepository,
          this.jeuneRepository
        )
        if (isFailure(resultQualificationEnSNP)) {
          idsActionsEnErreur.push(qualification.idAction)
          this.logger.warn(resultQualificationEnSNP.error.message)
          continue
        }
      }

      await this.actionRepository.save(actionQualifiee)
    }

    return success({
      idsActionsEnErreur
    })
  }

  async authorize(
    _command: QualifierActionsMiloCommand,
    utilisateur: Authentification.Utilisateur,
    actions: Action[]
  ): Promise<Result> {
    if (
      Authentification.estConseiller(utilisateur.type) &&
      estMilo(utilisateur.structure)
    ) {
      const idsJeunes = actions.map(action => action.idJeune)
      return this.conseillerAuthorizer.autoriserConseillerPourSesJeunes(
        idsJeunes,
        utilisateur
      )
    }
    return failure(new DroitsInsuffisants())
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: QualifierActionsMiloCommand,
    actions: Action[]
  ): Promise<void> {
    for (const action of actions) {
      const qualification = command.qualifications.find(
        qualification => qualification.idAction === action.id
      )
      if (qualification) {
        if (qualification.codeQualification === Qualification.Code.NON_SNP) {
          await this.evenementService.creer(
            Evenement.Code.ACTION_QUALIFIEE_MULTIPLE_NON_SNP,
            utilisateur
          )
        } else {
          await this.evenementService.creer(
            Evenement.Code.ACTION_QUALIFIEE_MULTIPLE_SNP,
            utilisateur
          )
        }
      }
    }
  }
}

async function qualifierEnSNP(
  actionQualifiee: Action.Qualifiee,
  utilisateur: Authentification.Utilisateur,
  actionMiloRepository: ActionMilo.Repository,
  jeuneRepository: Jeune.Repository
): Promise<Result> {
  const jeune = await jeuneRepository.get(actionQualifiee.idJeune)
  if (!jeune) {
    return failure(new NonTrouveError('Jeune non trouvé'))
  }

  const actionMiloResult = ActionMilo.creer(actionQualifiee, jeune, utilisateur)

  if (isFailure(actionMiloResult)) {
    return actionMiloResult
  }

  const qualificationResult = await actionMiloRepository.save(
    actionMiloResult.data
  )

  if (isFailure(qualificationResult)) {
    return qualificationResult
  }

  return emptySuccess()
}
