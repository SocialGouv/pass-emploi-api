import { Inject, Injectable } from '@nestjs/common'
import {
  ErreurHttp,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { failure, Result, success } from 'src/building-blocks/types/result'
import { ActionPoleEmploi } from 'src/domain/action'
import { Authentification } from 'src/domain/authentification'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { KeycloakClient } from '../../infrastructure/clients/keycloak-client'
import { PoleEmploiPartenaireClient } from '../../infrastructure/clients/pole-emploi-partenaire-client'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { fromDemarcheDtoToActionPoleEmploiQueryModel } from './query-mappers/actions-pole-emploi.mappers'
import { ActionPoleEmploiQueryModel } from './query-models/actions.query-model'

export interface GetActionsJeunePoleEmploiQuery extends Query {
  idJeune: string
  accessToken: string
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
    private idService: IdService,
    private dateService: DateService,
    private keycloakClient: KeycloakClient
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
    const idpToken = await this.keycloakClient.exchangeTokenPoleEmploiJeune(
      query.accessToken
    )

    try {
      const demarchesDto = await this.poleEmploiPartenaireClient.getDemarches(
        idpToken
      )

      const demarches = demarchesDto
        .map(demarcheDto =>
          fromDemarcheDtoToActionPoleEmploiQueryModel(
            demarcheDto,
            this.idService,
            this.dateService
          )
        )
        .sort(compareDemarchesByStatutOrDateFin)

      return success(demarches)
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

function compareDemarchesByStatutOrDateFin(
  demarche1: ActionPoleEmploiQueryModel,
  demarche2: ActionPoleEmploiQueryModel
): number {
  return (
    compareStatuts(demarche1, demarche2) ||
    compareDatesFin(demarche1, demarche2)
  )
}

const statutsOrder: { [statut in ActionPoleEmploi.Statut]: number } = {
  EN_RETARD: 0,
  A_FAIRE: 1,
  EN_COURS: 1,
  ANNULEE: 2,
  REALISEE: 2
}

function compareStatuts(
  demarche1: ActionPoleEmploiQueryModel,
  demarche2: ActionPoleEmploiQueryModel
): number {
  return statutsOrder[demarche1.statut] - statutsOrder[demarche2.statut]
}

function compareDatesFin(
  demarche1: ActionPoleEmploiQueryModel,
  demarche2: ActionPoleEmploiQueryModel
): number {
  return demarche1.dateFin.getTime() - demarche2.dateFin.getTime()
}
