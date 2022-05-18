import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Authentification } from '../../domain/authentification'
import {
  emptySuccess,
  isFailure,
  Result
} from '../../building-blocks/types/result'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { Campagne, CampagneRepositoryToken } from '../../domain/campagne'
import { Inject } from '@nestjs/common'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'

export interface CreateEvaluationCommand extends Command {
  idCampagne: string
  idJeune: string
  reponses: Array<{
    idQuestion: number
    idOption: number
    pourquoi?: string
  }>
}

export class CreateEvaluationCommandHandler extends CommandHandler<
  CreateEvaluationCommand,
  void
> {
  constructor(
    private campagneFactory: Campagne.Factory,
    @Inject(CampagneRepositoryToken)
    private campagneRepository: Campagne.Repository,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('CreateEvaluationCommandHandler')
  }

  async authorize(
    command: CreateEvaluationCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.jeuneAuthorizer.authorize(command.idJeune, utilisateur)
  }

  async handle(command: CreateEvaluationCommand): Promise<Result> {
    const campagne = await this.campagneRepository.get(command.idCampagne)
    const jeune = await this.jeuneRepository.get(command.idJeune)
    const evaluation = this.campagneFactory.evaluer(
      campagne,
      jeune!,
      command.reponses
    )

    if (isFailure(evaluation)) {
      return evaluation
    }

    await this.campagneRepository.saveEvaluation(evaluation.data)
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
