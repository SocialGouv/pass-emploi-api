import { Inject, Injectable } from '@nestjs/common'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { isFailure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Conseiller } from 'src/domain/conseiller/conseiller'
import { estMilo } from 'src/domain/core'
import { ConseillerMiloRepositoryToken } from 'src/domain/milo/conseiller.milo'
import { ConseillerAuthorizer } from '../../../authorizers/conseiller-authorizer'
import { ConfigService } from '@nestjs/config'
import {
  SessionConseillerMiloQueryModel,
  SessionsConseillerV2QueryModel
} from '../../query-models/sessions.milo.query.model'
import { GetSessionsConseillerMiloV2QueryGetter } from '../../query-getters/milo/v2/get-sessions-conseiller.milo.v2.query.getter.db'

export interface GetSessionsConseillerMiloV2Query extends Query {
  idConseiller: string
  accessToken: string
  page?: number
  filtrerAClore?: boolean
}

@Injectable()
export class GetSessionsConseillerMiloV2QueryHandler extends QueryHandler<
  GetSessionsConseillerMiloV2Query,
  Result<SessionsConseillerV2QueryModel>
> {
  constructor(
    private getSessionsConseillerMiloV2QueryGetter: GetSessionsConseillerMiloV2QueryGetter,
    @Inject(ConseillerMiloRepositoryToken)
    private conseillerMiloRepository: Conseiller.Milo.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private configService: ConfigService
  ) {
    super('GetSessionsConseillerMiloQueryHandler')
  }

  async handle(
    query: GetSessionsConseillerMiloV2Query
  ): Promise<Result<SessionsConseillerV2QueryModel>> {
    const FT_RECUPERER_SESSIONS_MILO = this.configService.get(
      'features.recupererSessionsMilo'
    )
    if (!FT_RECUPERER_SESSIONS_MILO) {
      return success({
        pagination: {
          page: 1,
          limit: 0,
          total: 0
        },
        resultats: []
      })
    }

    const resultConseiller = await this.conseillerMiloRepository.get(
      query.idConseiller
    )
    if (isFailure(resultConseiller)) {
      return resultConseiller
    }
    const { id: idStructureMilo, timezone: timezoneStructure } =
      resultConseiller.data.structure

    // todo faire l'appel au client milo une premiere fois
    // voir combien de sessions remonte pour le conseiller dans sa structure
    // mettre en place une fonction pour faire N nombre d'appel en fonction du nombre de session a récupérer
    // -> pour la date de recuperation de cloture ne pas oublier de mettre comme pour le getSession
    // créer une pagination de chez nous

    const resultSessionsMiloFromQueryGetter: Result<
      SessionConseillerMiloQueryModel[]
    > = await this.getSessionsConseillerMiloV2QueryGetter.handle(
      query.accessToken,
      idStructureMilo,
      timezoneStructure,
      { filtrerAClore: query.filtrerAClore }
    )

    if (isFailure(resultSessionsMiloFromQueryGetter)) {
      return resultSessionsMiloFromQueryGetter
    }

    //TODO gerer la pagination du front  pour renvoyer ce qui va bien selon la page demandé
    return success({
      pagination: {
        page: 1,
        limit: 1,
        total: 1
      },
      resultats: resultSessionsMiloFromQueryGetter.data
    })
  }

  async authorize(
    query: GetSessionsConseillerMiloV2Query,
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
