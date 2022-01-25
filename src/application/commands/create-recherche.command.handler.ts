/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable } from '@nestjs/common'
import { Result, success } from 'src/building-blocks/types/result'
import { IdService } from 'src/utils/id-service'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import { Recherche, RecherchesRepositoryToken } from '../../domain/recherche'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { GetOffresEmploiQuery } from '../queries/get-offres-emploi.query.handler'
import { GetOffresImmersionQuery } from '../queries/get-offres-immersion.query.handler'

export interface CreateRechercheCommand extends Command {
  idJeune: string
  type: Recherche.Type
  titre: string
  metier: string
  localisation: string
  criteres: GetOffresEmploiQuery | GetOffresImmersionQuery
}

@Injectable()
export class CreateRechercheCommandHandler extends CommandHandler<
  CreateRechercheCommand,
  Core.Id
> {
  constructor(
    @Inject(RecherchesRepositoryToken)
    private rechercheRepository: Recherche.Repository,
    private idService: IdService,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('CreateRechercheCommandHandler')
  }

  async handle(command: CreateRechercheCommand): Promise<Result<Core.Id>> {
    const idRecherche = this.idService.uuid()

    const recherche = {
      id: idRecherche,
      type: command.type,
      titre: command.titre,
      metier: command.metier,
      localisation: command.localisation,
      criteres: command.criteres
    }
    await this.rechercheRepository.saveRecherche(command.idJeune, recherche)
    return success({ id: idRecherche })
  }

  async authorize(
    command: CreateRechercheCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.jeuneAuthorizer.authorize(command.idJeune, utilisateur)
  }

  async monitor(
    _utilisateur: Authentification.Utilisateur,
    _command: CreateRechercheCommand
  ): Promise<void> {
    return
  }
}
