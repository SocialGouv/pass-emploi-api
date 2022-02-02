import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Conseiller } from '../../domain/conseiller'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { DetailJeuneQueryModel } from './query-models/jeunes.query-models'

export interface GetJeunesByConseillerQuery extends Query {
  idConseiller: string
}

@Injectable()
export class GetJeunesByConseillerQueryHandler extends QueryHandler<
  GetJeunesByConseillerQuery,
  DetailJeuneQueryModel[]
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private readonly conseillersRepository: Conseiller.Repository,
    private readonly jeunesRepository: Jeune.Repository,
    private readonly conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('GetJeunesByConseillerQueryHandler')
  }

  async handle(
    query: GetJeunesByConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<DetailJeuneQueryModel[]> {
    const conseiller = await this.conseillersRepository.get(query.idConseiller)
    if (!conseiller) throw new NonTrouveError('Conseiller', query.idConseiller)
    if (
      !(
        utilisateur.roles.includes(Authentification.Role.SUPERVISEUR) &&
        conseiller.structure === utilisateur.structure
      ) &&
      query.idConseiller !== utilisateur.id
    )
      throw new DroitsInsuffisants()

    return this.jeunesRepository.getAllQueryModelsByConseiller(
      query.idConseiller
    )
  }

  async authorize(
    _query: GetJeunesByConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    return this.conseillerAuthorizer.authorizeConseiller(utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
