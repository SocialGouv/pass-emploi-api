import { Inject, Injectable } from '@nestjs/common'
import {
  ErreurHttp,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { failure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import { IdService } from 'src/utils/id-service'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  DemarcheDto,
  PoleEmploiPartenaireClient
} from '../../infrastructure/clients/pole-emploi-partenaire-client'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { fromDemarcheDtoToActionPoleEmploiQueryModel } from './query-mappers/actions-pole-emploi.mappers'
import { ActionPoleEmploiQueryModel } from './query-models/actions.query-model'

export interface GetActionsJeunePoleEmploiQuery extends Query {
  idJeune: string
  idpToken: string
}

@Injectable()
export class GetActionsJeunePoleEmploiQueryHandler extends QueryHandler<
  GetActionsJeunePoleEmploiQuery,
  Result<ActionPoleEmploiQueryModel[]>
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private poleEmploiPartenaireClient: PoleEmploiPartenaireClient,
    private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer,
    private idService: IdService
  ) {
    super('GetActionsJeunePoleEmploiQueryHandler')
  }

  async handle(
    query: GetActionsJeunePoleEmploiQuery
  ): Promise<Result<ActionPoleEmploiQueryModel[]>> {
    const jeune = await this.jeuneRepository.get(query.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }

    try {
      const responseDemarches =
        await this.poleEmploiPartenaireClient.getDemarches(query.idpToken)

      const demarchesDto: DemarcheDto[] = responseDemarches?.data ?? []

      return success(
        demarchesDto.map(demarcheDto =>
          fromDemarcheDtoToActionPoleEmploiQueryModel(
            demarcheDto,
            this.idService
          )
        )
      )
    } catch (e) {
      this.logger.error(e)
      if (e.response) {
        return failure(
          new ErreurHttp(e.response.data?.message, e.response.status)
        )
      }
      throw e
    }
  }

  async authorize(
    query: GetActionsJeunePoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.jeunePoleEmploiAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
