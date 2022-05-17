import { Command } from '../../building-blocks/types/command'
import { DateTime } from 'luxon'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Authentification } from '../../domain/authentification'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Unauthorized } from '../../domain/erreur'
import { Inject } from '@nestjs/common'
import { Campagne, CampagneRepositoryToken } from '../../domain/campagne'
import { CampagneExisteDejaError } from '../../building-blocks/types/domain-error'
import { Core } from '../../domain/core'

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
    private campagneFactory: Campagne.Factory
  ) {
    super('CreateCampagneCommandHandler')
  }

  async authorize(
    _command: CreateCampagneCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (utilisateur.type !== Authentification.Type.SUPPORT) {
      throw new Unauthorized(utilisateur.type)
    }
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

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async monitor(): Promise<void> {}
}
