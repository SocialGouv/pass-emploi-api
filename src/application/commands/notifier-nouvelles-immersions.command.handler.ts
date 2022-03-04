import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { OffresImmersion } from '../../domain/offre-immersion'
import { Recherche, RecherchesRepositoryToken } from '../../domain/recherche'
import { GetOffresImmersionQuery } from '../queries/get-offres-immersion.query.handler'

export interface NotifierNouvellesImmersionsCommand extends Command {
  immersions: Array<{
    id: string
    metier: string
    nomEtablissement: string
    secteurActivite: string
    ville: string
    estVolontaire: boolean
    adresse: string
    localisation?: {
      latitude: number
      longitude: number
    }
    contact?: {
      id: string
      nom: string
      prenom: string
      role: string
      email?: string
      telephone?: string
      modeDeContact?: OffresImmersion.MethodeDeContact
    }
  }>
}

@Injectable()
export class NotifierNouvellesImmersionsCommandHandler extends CommandHandler<
  NotifierNouvellesImmersionsCommand,
  void
> {
  constructor(
    @Inject(RecherchesRepositoryToken)
    private recherchesRepository: Recherche.Repository
  ) {
    super('NotifierNouvellesImmersionsHandler')
  }

  async handle(command: NotifierNouvellesImmersionsCommand): Promise<Result> {
    for (const immersion of command.immersions) {
      if (
        immersion.localisation?.latitude &&
        immersion.localisation?.longitude
      ) {
        const criteres: GetOffresImmersionQuery = {
          rome: immersion.metier,
          lat: immersion.localisation.latitude,
          lon: immersion.localisation.longitude
        }
        const recherches =
          await this.recherchesRepository.trouverLesRecherchesImmersions(
            criteres
          )

        if (recherches.length) {
          this.logger.log('ON NOTIFIE')
          this.logger.log(recherches)
        }
      }
    }
    return emptySuccess()
  }

  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _command: NotifierNouvellesImmersionsCommand
  ): Promise<void> {
    return
  }

  async monitor(): Promise<void> {
    return
  }
}
