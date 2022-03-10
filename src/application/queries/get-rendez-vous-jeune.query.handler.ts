import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { RendezVous, RendezVousRepositoryToken } from '../../domain/rendez-vous'
import { ConseillerForJeuneAuthorizer } from '../authorizers/authorize-conseiller-for-jeune'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { RendezVousQueryModel } from './query-models/rendez-vous.query-models'

export interface GetRendezVousJeuneQuery extends Query {
  idJeune: string
}

@Injectable()
export class GetRendezVousJeuneQueryHandler extends QueryHandler<
  GetRendezVousJeuneQuery,
  RendezVousQueryModel[]
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
  ): Promise<RendezVousQueryModel[]> {
    return this.rendezVousRepository.getAllQueryModelsByJeune(query.idJeune)
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
