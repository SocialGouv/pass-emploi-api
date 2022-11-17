import { Injectable } from '@nestjs/common'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'
import { RendezVous } from '../../domain/rendez-vous/rendez-vous'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { RendezVousJeuneQueryModel } from './query-models/rendez-vous.query-model'
import { GetRendezVousJeunePoleEmploiQueryGetter } from './query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'

export interface GetRendezVousJeunePoleEmploiQuery extends Query {
  idJeune: string
  accessToken: string
  periode?: RendezVous.Periode
}

@Injectable()
export class GetRendezVousJeunePoleEmploiQueryHandler extends QueryHandler<
  GetRendezVousJeunePoleEmploiQuery,
  Result<RendezVousJeuneQueryModel[]>
> {
  constructor(
    private getRendezVousJeunePoleEmploiQueryGetter: GetRendezVousJeunePoleEmploiQueryGetter,
    private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer,
    private evenementService: EvenementService
  ) {
    super('GetRendezVousJeunePoleEmploiQueryHandler')
  }

  async handle(
    query: GetRendezVousJeunePoleEmploiQuery
  ): Promise<Result<RendezVousJeuneQueryModel[]>> {
    return this.getRendezVousJeunePoleEmploiQueryGetter.handle(query)
  }

  async authorize(
    query: GetRendezVousJeunePoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeunePoleEmploiAuthorizer.authorize(query.idJeune, utilisateur)
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
