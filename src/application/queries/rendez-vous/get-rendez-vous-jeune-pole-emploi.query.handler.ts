import { Injectable } from '@nestjs/common'
import { DateService } from 'src/utils/date-service'
import { Cached, Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Result } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { estPoleEmploiOuCD } from '../../../domain/core'
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
    private evenementService: EvenementService,
    private dateService: DateService
  ) {
    super('GetRendezVousJeunePoleEmploiQueryHandler')
  }

  async handle(
    query: GetRendezVousJeunePoleEmploiQuery
  ): Promise<Result<Cached<RendezVousJeuneQueryModel[]>>> {
    const { periode, idJeune, accessToken } = query
    if (periode === RendezVous.Periode.PASSES) {
      return this.getRendezVousJeunePoleEmploiQueryGetter.handle({
        idJeune,
        accessToken,
        dateFin: this.dateService.now()
      })
    } else {
      return this.getRendezVousJeunePoleEmploiQueryGetter.handle({
        idJeune,
        accessToken,
        dateDebut: this.dateService.now()
      })
    }
  }

  async authorize(
    query: GetRendezVousJeunePoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      query.idJeune,
      utilisateur,
      estPoleEmploiOuCD(utilisateur.structure)
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
