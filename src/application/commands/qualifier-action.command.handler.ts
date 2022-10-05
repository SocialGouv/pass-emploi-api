import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import {
  Action,
  ActionMiloRepositoryToken,
  ActionsRepositoryToken
} from '../../domain/action/action'
import { Authentification } from '../../domain/authentification'
import { ActionAuthorizer } from '../authorizers/authorize-action'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
import { QualificationActionQueryModel } from '../queries/query-models/actions.query-model'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Command } from '../../building-blocks/types/command'
import { DateTime } from 'luxon'

export interface QualifierActionCommand extends Command {
  idAction: string
  codeQualification: Action.Qualification.Code
  utilisateur: Authentification.Utilisateur
  dateDebut?: DateTime
  dateFinReelle?: DateTime
}

@Injectable()
export class QualifierActionCommandHandler extends CommandHandler<
  QualifierActionCommand,
  QualificationActionQueryModel
> {
  constructor(
    @Inject(ActionsRepositoryToken)
    private readonly actionRepository: Action.Repository,
    @Inject(ActionMiloRepositoryToken)
    private readonly actionMiloRepository: Action.Milo.Repository,
    private readonly actionAuthorizer: ActionAuthorizer,
    @Inject(JeunesRepositoryToken)
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

    const qualifierActionResult = Action.qualifier(
      action,
      command.codeQualification,
      command.dateDebut,
      command.dateFinReelle
    )

    if (isFailure(qualifierActionResult)) {
      return qualifierActionResult
    }

    const estUneSituationNonProfessionnelle =
      qualifierActionResult.data.qualification.code !==
      Action.Qualification.Code.NON_SNP

    if (estUneSituationNonProfessionnelle) {
      const jeune = await this.jeuneRepository.get(
        qualifierActionResult.data.idJeune
      )
      if (!jeune) {
        return failure(
          new NonTrouveError('Jeune', qualifierActionResult.data.idJeune)
        )
      }

      const creerActionMiloResult = Action.Milo.creer(
        qualifierActionResult.data,
        jeune,
        command.utilisateur
      )

      if (isFailure(creerActionMiloResult)) {
        return creerActionMiloResult
      }

      const creerSNPResult = await this.actionMiloRepository.save(
        creerActionMiloResult.data
      )
      if (isFailure(creerSNPResult)) {
        return creerSNPResult
      }
    }
    await this.actionRepository.save(qualifierActionResult.data)

    const typeQualification =
      Action.Qualification.mapCodeTypeQualification[
        qualifierActionResult.data.qualification.code
      ]

    return success({
      code: qualifierActionResult.data.qualification.code,
      libelle: typeQualification.label,
      heures: typeQualification.heures
    })
  }

  async authorize(
    command: QualifierActionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      return this.actionAuthorizer.authorize(command.idAction, utilisateur)
    }
    return failure(new DroitsInsuffisants())
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: QualifierActionCommand
  ): Promise<void> {
    if (command.codeQualification === Action.Qualification.Code.NON_SNP) {
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
