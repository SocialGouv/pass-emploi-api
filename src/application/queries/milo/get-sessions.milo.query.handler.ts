import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import {
  Result,
  isFailure,
  success
} from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { Conseiller } from '../../../domain/conseiller/conseiller'
import { estMilo } from '../../../domain/core'
import { ConseillerMiloRepositoryToken } from '../../../domain/milo/conseiller.milo'
import { SessionConseillerDetailDto } from '../../../infrastructure/clients/dto/milo.dto'
import { KeycloakClient } from '../../../infrastructure/clients/keycloak-client'
import { MiloClient } from '../../../infrastructure/clients/milo-client'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'

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
    private conseillerAuthorizer: ConseillerAuthorizer,
    private keycloakClient: KeycloakClient
  ) {
    super('GetSessionsMiloQueryHandler')
  }

  async handle(
    query: GetSessionsMiloQuery
  ): Promise<Result<SessionConseillerMiloQueryModel[]>> {
    const idpToken = await this.keycloakClient.exchangeTokenConseillerMilo(
      query.token
    )

    const resultConseiller = await this.conseillerRepository.get(
      query.idConseiller
    )
    if (isFailure(resultConseiller)) {
      return resultConseiller
    }

    const result = await this.miloClient.getSessionsConseiller(
      idpToken,
      resultConseiller.data.idStructure
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
