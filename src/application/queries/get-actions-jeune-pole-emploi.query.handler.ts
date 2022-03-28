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
import {
  DemarcheDto,
  PoleEmploiPartenaireClient
} from '../../infrastructure/clients/pole-emploi-partenaire-client'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { fromDemarcheDtoToActionPoleEmploiQueryModel } from './query-mappers/actions-pole-emploi.mappers'
import { ActionPoleEmploiQueryModel } from './query-models/actions.query-model'

const Statut = ActionPoleEmploi.Statut

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
    private idService: IdService,
    private dateService: DateService
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

      const demarches = demarchesDto
        .map(demarcheDto =>
          fromDemarcheDtoToActionPoleEmploiQueryModel(
            demarcheDto,
            this.idService,
            this.dateService
          )
        )
        .sort(sortDemarchesByStatut)

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

function sortDemarchesByStatut(
  demarche1: ActionPoleEmploiQueryModel,
  demarche2: ActionPoleEmploiQueryModel
): number {
  if (statutEgal(demarche1.statut, demarche2.statut)) {
    const date1 = new Date(demarche1.dateFin).getTime()
    const date2 = new Date(demarche2.dateFin).getTime()

    if (date1 < date2) return -1
    if (date1 > date2) return 1
    return 0
  }
  if (stautInferieur(demarche1.statut, demarche2.statut)) {
    return -1
  }
  return 1
}

const statutsEnCours = [Statut.EN_COURS, Statut.A_FAIRE]
const statutsTermines = [Statut.REALISEE, Statut.ANNULEE]

function statutEgal(
  statut1: ActionPoleEmploi.Statut,
  statut2: ActionPoleEmploi.Statut
): boolean {
  return (
    statut1 === statut2 ||
    (statutsEnCours.includes(statut1) && statutsEnCours.includes(statut2)) ||
    (statutsTermines.includes(statut1) && statutsTermines.includes(statut2))
  )
}

function stautInferieur(
  statut1: ActionPoleEmploi.Statut,
  statut2: ActionPoleEmploi.Statut
): boolean {
  if (statut1 === Statut.EN_RETARD) return true
  if (statutsEnCours.includes(statut1) && statutsTermines.includes(statut2))
    return true
  return false
}
