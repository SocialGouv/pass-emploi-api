import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { RendezVous, RendezVousRepositoryToken } from '../../domain/rendez-vous'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { RendezVousConseillerQueryModel } from './query-models/rendez-vous.query-models'

export interface GetAllRendezVousConseiller extends Query {
  idConseiller: string
}

@Injectable()
export class GetAllRendezVousConseillerQueryHandler extends QueryHandler<
  GetAllRendezVousConseiller,
  RendezVousConseillerQueryModel
> {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super()
  }

  async handle(
    query: GetAllRendezVousConseiller
  ): Promise<RendezVousConseillerQueryModel> {
    return this.rendezVousRepository.getAllQueryModelsByConseiller(
      query.idConseiller
    )
  }
  async authorize(
    query: GetAllRendezVousConseiller,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.conseillerAuthorizer.authorize(query.idConseiller, utilisateur)
  }
}
