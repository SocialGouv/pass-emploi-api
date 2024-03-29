import { Injectable } from '@nestjs/common'
import { Cached, Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Result } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { estPoleEmploiBRSA } from '../../../domain/core'
import { Evenement, EvenementService } from '../../../domain/evenement'
import { RendezVous } from '../../../domain/rendez-vous/rendez-vous'
import { JeuneAuthorizer } from '../../authorizers/jeune-authorizer'
import { GetRendezVousJeunePoleEmploiQueryGetter } from '../query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { RendezVousJeuneQueryModel } from '../query-models/rendez-vous.query-model'

export interface GetRendezVousJeunePoleEmploiQuery extends Query {
  idJeune: string
  accessToken: string
  periode?: RendezVous.Periode
}

@Injectable()
export class GetRendezVousJeunePoleEmploiQueryHandler extends QueryHandler<
  GetRendezVousJeunePoleEmploiQuery,
  Result<Cached<RendezVousJeuneQueryModel[]>>
> {
  constructor(
    private getRendezVousJeunePoleEmploiQueryGetter: GetRendezVousJeunePoleEmploiQueryGetter,
    private jeuneAuthorizer: JeuneAuthorizer,
    private evenementService: EvenementService
  ) {
    super('GetRendezVousJeunePoleEmploiQueryHandler')
  }

  async handle(
    query: GetRendezVousJeunePoleEmploiQuery
  ): Promise<Result<Cached<RendezVousJeuneQueryModel[]>>> {
    return this.getRendezVousJeunePoleEmploiQueryGetter.handle(query)
  }

  async authorize(
    query: GetRendezVousJeunePoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      query.idJeune,
      utilisateur,
      estPoleEmploiBRSA(utilisateur.structure)
    )
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    query: GetRendezVousJeunePoleEmploiQuery
  ): Promise<void> {
    if (query?.periode !== RendezVous.Periode.PASSES) {
      await this.evenementService.creer(Evenement.Code.RDV_LISTE, utilisateur)
    }
  }
}
