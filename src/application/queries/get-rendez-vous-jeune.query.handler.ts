import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { RendezVous, RendezVousRepositoryToken } from '../../domain/rendez-vous'
import { ConseillerForJeuneAuthorizer } from '../authorizers/authorize-conseiller-for-jeune'
import { RendezVousQueryModel } from './query-models/rendez-vous.query-models'

export interface GetAllRendezVousJeune extends Query {
  idJeune: string
}

@Injectable()
export class GetAllRendezVousJeuneQueryHandler extends QueryHandler<
  GetAllRendezVousJeune,
  RendezVousQueryModel[]
> {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    private conseillerForJeuneAuthorizer: ConseillerForJeuneAuthorizer
  ) {
    super()
  }

  async handle(query: GetAllRendezVousJeune): Promise<RendezVousQueryModel[]> {
    return this.rendezVousRepository.getAllQueryModelsByJeune(query.idJeune)
  }
  async authorize(
    query: GetAllRendezVousJeune,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.conseillerForJeuneAuthorizer.authorize(
      query.idJeune,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
