import { Inject, Injectable } from '@nestjs/common'
import { Result, success } from '../../building-blocks/types/result'
import { IdService } from '../../utils/id-service'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import {
  Recherche,
  RecherchesRepositoryToken
} from '../../domain/offre/recherche/recherche'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { Evenement, EvenementService } from '../../domain/evenement'
import { DateService } from '../../utils/date-service'

export interface CreateRechercheCommand extends Command {
  idJeune: string
  type: Recherche.Type
  titre: string
  metier?: string
  localisation?: string
  criteres?: Recherche.Immersion | Recherche.Emploi | Recherche.ServiceCivique
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
    private jeuneAuthorizer: JeuneAuthorizer,
    private evenementService: EvenementService,
    private dateService: DateService
  ) {
    super('CreateRechercheCommandHandler')
  }

  async handle(command: CreateRechercheCommand): Promise<Result<Core.Id>> {
    const idRecherche = this.idService.uuid()

    const maintenant = this.dateService.now()

    const recherche: Recherche = {
      id: idRecherche,
      type: command.type,
      titre: command.titre,
      metier: command.metier,
      localisation: command.localisation,
      criteres: command.criteres,
      idJeune: command.idJeune,
      dateCreation: maintenant,
      dateDerniereRecherche: maintenant,
      etat: Recherche.Etat.SUCCES
    }

    await this.rechercheRepository.save(recherche)
    return success({ id: idRecherche })
  }

  async authorize(
    command: CreateRechercheCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorize(command.idJeune, utilisateur)
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: CreateRechercheCommand
  ): Promise<void> {
    let evenementType: Evenement.Code
    switch (command.type) {
      case Recherche.Type.OFFRES_ALTERNANCE:
        evenementType = Evenement.Code.RECHERCHE_ALTERNANCE_SAUVEGARDEE
        break
      case Recherche.Type.OFFRES_SERVICES_CIVIQUE:
        evenementType = Evenement.Code.RECHERCHE_SERVICE_CIVIQUE_SAUVEGARDEE
        break
      case Recherche.Type.OFFRES_EMPLOI:
        evenementType = Evenement.Code.RECHERCHE_OFFRE_EMPLOI_SAUVEGARDEE
        break
      default:
        evenementType = Evenement.Code.RECHERCHE_IMMERSION_SAUVEGARDEE
        break
    }
    await this.evenementService.creer(evenementType, utilisateur)
  }
}
