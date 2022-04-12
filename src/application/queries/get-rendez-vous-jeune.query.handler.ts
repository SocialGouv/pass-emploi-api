import { Inject, Injectable } from '@nestjs/common'
import { Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { RendezVous, RendezVousRepositoryToken } from '../../domain/rendez-vous'
import { ConseillerForJeuneAuthorizer } from '../authorizers/authorize-conseiller-for-jeune'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { RendezVousQueryModel } from './query-models/rendez-vous.query-models'

export interface GetRendezVousJeuneQuery extends Query {
  idJeune: string
  periode?: RendezVous.Periode
}

@Injectable()
export class GetRendezVousJeuneQueryHandler extends QueryHandler<
  GetRendezVousJeuneQuery,
  Result<RendezVousQueryModel[]>
> {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    private conseillerForJeuneAuthorizer: ConseillerForJeuneAuthorizer,
    private jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('GetRendezVousJeuneQueryHandler')
  }

  async handle(
    query: GetRendezVousJeuneQuery
  ): Promise<Result<RendezVousQueryModel[]>> {
    let responseRendezVous: RendezVousQueryModel[]

    switch (query.periode) {
      case RendezVous.Periode.PASSES:
        responseRendezVous =
          await this.rendezVousRepository.getRendezVousPassesQueryModelsByJeune(
            query.idJeune
          )
        break
      case RendezVous.Periode.FUTURS:
        responseRendezVous =
          await this.rendezVousRepository.getRendezVousFutursQueryModelsByJeune(
            query.idJeune
          )
        break
      default:
        responseRendezVous =
          await this.rendezVousRepository.getAllQueryModelsByJeune(
            query.idJeune
          )
    }

    return success(responseRendezVous)
  }
  async authorize(
    query: GetRendezVousJeuneQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (utilisateur.type === Authentification.Type.CONSEILLER) {
      await this.conseillerForJeuneAuthorizer.authorize(
        query.idJeune,
        utilisateur
      )
    } else {
      await this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
    }
  }

  async monitor(): Promise<void> {
    return
  }
}
