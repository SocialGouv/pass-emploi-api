import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { DetailJeuneQueryModel } from './query-models/jeunes.query-models'

export interface GetJeunesByConseillerQuery extends Query {
  idConseiller: string
}

@Injectable()
export class GetJeunesByConseillerQueryHandler extends QueryHandler<
  GetJeunesByConseillerQuery,
  Result<DetailJeuneQueryModel[]>
> {
  constructor(
    @Inject(ConseillersRepositoryToken)
    private readonly conseillersRepository: Conseiller.Repository,
    @Inject(JeunesRepositoryToken)
    private readonly jeunesRepository: Jeune.Repository,
    private readonly conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('GetJeunesByConseillerQueryHandler')
  }

  async handle(
    query: GetJeunesByConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<DetailJeuneQueryModel[]>> {
    const conseiller = await this.conseillersRepository.get(query.idConseiller)
    if (!conseiller) {
      return failure(new NonTrouveError('Conseiller', query.idConseiller))
    }
    if (
      !utilisateurEstSuperviseurDuConseiller(utilisateur, conseiller) &&
      !utilisateurEstConseiller(utilisateur, conseiller)
    ) {
      return failure(new DroitsInsuffisants())
    }

    const jeunes = await this.jeunesRepository.getAllQueryModelsByConseiller(
      conseiller.id
    )
    return success(jeunes)
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

function utilisateurEstSuperviseurDuConseiller(
  utilisateur: Authentification.Utilisateur,
  conseiller: Conseiller
): boolean {
  return (
    Authentification.estSuperviseur(utilisateur) &&
    conseiller.structure === utilisateur.structure
  )
}

function utilisateurEstConseiller(
  utilisateur: Authentification.Utilisateur,
  conseiller: Conseiller
): boolean {
  return conseiller.id === utilisateur.id
}
