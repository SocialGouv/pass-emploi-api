import { Inject } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { CampagneExisteDejaError } from '../../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { Campagne, CampagneRepositoryToken } from '../../../domain/campagne'
import { Core } from '../../../domain/core'
import { SupportAuthorizer } from '../../authorizers/support-authorizer'

export interface CreateCampagneCommand extends Command {
  nom: string
  dateDebut: DateTime
  dateFin: DateTime
}

export class CreateCampagneCommandHandler extends CommandHandler<
  CreateCampagneCommand,
  Core.Id
> {
  constructor(
    @Inject(CampagneRepositoryToken)
    private campagneRepository: Campagne.Repository,
    private campagneFactory: Campagne.Factory,
    private supportAuthorizer: SupportAuthorizer
  ) {
    super('CreateCampagneCommandHandler')
  }

  async authorize(
    _command: CreateCampagneCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.supportAuthorizer.autoriserSupport(utilisateur)
  }

  async handle(command: CreateCampagneCommand): Promise<Result<Core.Id>> {
    const campagneExistanteSurLIntervalleOuLeNom =
      await this.campagneRepository.getByIntervalOrName(
        command.dateDebut,
        command.dateFin,
        command.nom
      )

    if (campagneExistanteSurLIntervalleOuLeNom) {
      return failure(new CampagneExisteDejaError())
    }

    const campagne = this.campagneFactory.creer(command)
    await this.campagneRepository.save(campagne)

    return success({ id: campagne.id })
  }

  async monitor(): Promise<void> {
    return
  }
}
