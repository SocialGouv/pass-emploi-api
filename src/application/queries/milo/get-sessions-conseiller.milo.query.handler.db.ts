import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { isFailure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Conseiller } from 'src/domain/conseiller/conseiller'
import { estMilo } from 'src/domain/core'
import { ConseillerMiloRepositoryToken } from 'src/domain/milo/conseiller.milo'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { SessionConseillerMiloQueryModel } from '../query-models/sessions.milo.query.model'
import { ConfigService } from '@nestjs/config'
import { GetSessionsConseillerMiloQueryGetter } from '../query-getters/milo/get-sessions-conseiller.milo.query.getter.db'

export interface GetSessionsConseillerMiloQuery extends Query {
  idConseiller: string
  accessToken: string
  dateDebut?: DateTime
  dateFin?: DateTime
  filtrerAClore?: boolean
}

@Injectable()
export class GetSessionsConseillerMiloQueryHandler extends QueryHandler<
  GetSessionsConseillerMiloQuery,
  Result<SessionConseillerMiloQueryModel[]>
> {
  constructor(
    private getSessionsConsseillerMiloQueryGetter: GetSessionsConseillerMiloQueryGetter,
    @Inject(ConseillerMiloRepositoryToken)
    private conseillerMiloRepository: Conseiller.Milo.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private configService: ConfigService
  ) {
    super('GetSessionsConseillerMiloQueryHandler')
  }

  async handle(
    query: GetSessionsConseillerMiloQuery
  ): Promise<Result<SessionConseillerMiloQueryModel[]>> {
    const FT_RECUPERER_SESSIONS_MILO = this.configService.get(
      'features.recupererSessionsMilo'
    )
    if (!FT_RECUPERER_SESSIONS_MILO) {
      return success([])
    }

    const resultConseiller = await this.conseillerMiloRepository.get(
      query.idConseiller
    )
    if (isFailure(resultConseiller)) {
      return resultConseiller
    }
    const { id: idStructureMilo, timezone: timezoneStructure } =
      resultConseiller.data.structure

    let periode
    if (query.dateDebut || query.dateFin)
      periode = { debut: query.dateDebut, fin: query.dateFin }
    const resultSessionsMiloFromQueryGetter =
      await this.getSessionsConsseillerMiloQueryGetter.handle(
        query.accessToken,
        idStructureMilo,
        timezoneStructure,
        { filtrerAClore: query.filtrerAClore, periode }
      )

    if (isFailure(resultSessionsMiloFromQueryGetter)) {
      return resultSessionsMiloFromQueryGetter
    }

    return resultSessionsMiloFromQueryGetter
  }

  async authorize(
    query: GetSessionsConseillerMiloQuery,
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
