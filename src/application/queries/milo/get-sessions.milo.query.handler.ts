import { Inject, Injectable } from '@nestjs/common'
import { NonTrouveError } from '../../../building-blocks/types/domain-error'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import {
  Result,
  failure,
  isFailure,
  success
} from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { Conseiller } from '../../../domain/conseiller/conseiller'
import { estMilo } from '../../../domain/core'
import { ConseillerMiloRepositoryToken } from '../../../domain/milo/conseiller.milo'
import { MiloClient } from '../../../infrastructure/clients/milo-client'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { SessionConseillerDetailDto } from '../../../infrastructure/clients/dto/milo.dto'

export class SessionConseillerMiloQueryModel {
  id: string
  nom: string
  dateHeureDebut: string
  dateHeureFin: string
  dateMaxInscription: string
  animateur: string
  lieu: string
  nbPlacesDisponibles: number
  commentaire: string
}
export interface GetSessionsMiloQuery extends Query {
  idConseiller: string
  token: string
}

@Injectable()
export class GetSessionsMiloQueryHandler extends QueryHandler<
  GetSessionsMiloQuery,
  Result<SessionConseillerMiloQueryModel[]>
> {
  constructor(
    private miloClient: MiloClient,
    @Inject(ConseillerMiloRepositoryToken)
    private conseillerRepository: Conseiller.Milo.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('GetSessionsMiloQueryHandler')
  }

  async handle(
    query: GetSessionsMiloQuery
  ): Promise<Result<SessionConseillerMiloQueryModel[]>> {
    const conseiller = await this.conseillerRepository.get(query.idConseiller)
    if (!conseiller) {
      return failure(new NonTrouveError('Conseiller Milo', query.idConseiller))
    }

    const result = await this.miloClient.getSessionsConseiller(
      query.token,
      conseiller.idStructure
    )
    if (isFailure(result)) {
      return result
    }
    return success(result.data.sessions.map(mapSessionDtoToQueryModel))
  }

  async authorize(
    query: GetSessionsMiloQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseiller(
      query.idConseiller,
      utilisateur,
      estMilo(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}

function mapSessionDtoToQueryModel(
  sessionDto: SessionConseillerDetailDto
): SessionConseillerMiloQueryModel {
  return {
    id: sessionDto.session.id.toString(),
    nom: sessionDto.session.nom,
    dateHeureDebut: sessionDto.session.dateHeureDebut,
    dateHeureFin: sessionDto.session.dateHeureFin,
    dateMaxInscription: sessionDto.session.dateMaxInscription!,
    animateur: sessionDto.session.animateur,
    lieu: sessionDto.session.lieu,
    nbPlacesDisponibles: sessionDto.session.nbPlacesDisponibles!,
    commentaire: sessionDto.session.commentaire!
  }
}
