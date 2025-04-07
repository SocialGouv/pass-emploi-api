import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../../building-blocks/types/domain-error'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../../building-blocks/types/result'
import { Action, ActionRepositoryToken } from '../../../domain/action/action'
import { Qualification } from '../../../domain/action/qualification'
import { Authentification } from '../../../domain/authentification'
import { Evenement, EvenementService } from '../../../domain/evenement'
import { Jeune, JeuneRepositoryToken } from '../../../domain/jeune/jeune'
import {
  ActionMilo,
  ActionMiloRepositoryToken
} from '../../../domain/milo/action.milo'
import { ActionAuthorizer } from '../../authorizers/action-authorizer'
import { QualificationActionQueryModel } from '../../queries/query-models/actions.query-model'

export interface QualifierActionCommand extends Command {
  idAction: string
  codeQualification: Qualification.Code
  utilisateur: Authentification.Utilisateur
  commentaireQualification?: string
  dateDebut?: DateTime
  dateFinReelle?: DateTime
}

@Injectable()
export class QualifierActionCommandHandler extends CommandHandler<
  QualifierActionCommand,
  QualificationActionQueryModel
> {
  constructor(
    @Inject(ActionRepositoryToken)
    private readonly actionRepository: Action.Repository,
    @Inject(ActionMiloRepositoryToken)
    private readonly actionMiloRepository: ActionMilo.Repository,
    private readonly actionAuthorizer: ActionAuthorizer,
    @Inject(JeuneRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    private readonly evenementService: EvenementService
  ) {
    super('QualifierActionCommandHandler')
  }

  async handle(
    command: QualifierActionCommand
  ): Promise<Result<QualificationActionQueryModel>> {
    const action = await this.actionRepository.get(command.idAction)

    if (!action) {
      return failure(new NonTrouveError('Action', command.idAction))
    }

    const qualifierResult = Action.qualifier(
      action,
      command.codeQualification,
      command.commentaireQualification,
      command.dateDebut,
      command.dateFinReelle
    )

    if (isFailure(qualifierResult)) {
      return qualifierResult
    }

    const actionQualifiee: Action.Qualifiee = qualifierResult.data

    const estSNP =
      actionQualifiee.qualification.code !== Qualification.Code.NON_SNP

    if (estSNP) {
      const jeune = await this.jeuneRepository.get(actionQualifiee.idJeune)
      if (!jeune) {
        return failure(new NonTrouveError('Jeune', actionQualifiee.idJeune))
      }

      const actionMiloResult = ActionMilo.creer(
        actionQualifiee,
        jeune,
        command.utilisateur
      )

      if (isFailure(actionMiloResult)) {
        return actionMiloResult
      }

      const qualificationResult = await this.actionMiloRepository.save(
        actionMiloResult.data
      )
      if (isFailure(qualificationResult)) {
        return qualificationResult
      }
    }
    await this.actionRepository.save(actionQualifiee)

    const typeQualification =
      Qualification.mapCodeTypeQualification[actionQualifiee.qualification.code]

    return success({
      code: actionQualifiee.qualification.code,
      commentaireQualification: actionQualifiee.qualification.commentaire,
      libelle: typeQualification.label,
      heures: typeQualification.heures
    })
  }

  async authorize(
    command: QualifierActionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (Authentification.estConseiller(utilisateur.type)) {
      return this.actionAuthorizer.autoriserPourUneAction(
        command.idAction,
        utilisateur
      )
    }
    return failure(new DroitsInsuffisants())
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: QualifierActionCommand
  ): Promise<void> {
    if (command.codeQualification === Qualification.Code.NON_SNP) {
      await this.evenementService.creer(
        Evenement.Code.ACTION_QUALIFIEE_NON_SNP,
        utilisateur
      )
    } else {
      await this.evenementService.creer(
        Evenement.Code.ACTION_QUALIFIEE_SNP,
        utilisateur
      )
    }
  }
}
