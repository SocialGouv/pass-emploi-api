import { Inject, Injectable, Logger } from '@nestjs/common'
import { DateTime } from 'luxon'
import { ResultApi } from '../../../../building-blocks/types/result-api'
import {
  Authentification,
  AuthentificationRepositoryToken
} from '../../../../domain/authentification'
import { DemarcheDto } from 'src/infrastructure/clients/dto/pole-emploi.dto'
import { NonTrouveError } from '../../../../building-blocks/types/domain-error'
import { Cached } from '../../../../building-blocks/types/query'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../../../building-blocks/types/result'
import { Demarche } from '../../../../domain/demarche'
import { KeycloakClient } from '../../../../infrastructure/clients/keycloak-client.db'
import {
  PoleEmploiPartenaireClient,
  PoleEmploiPartenaireClientToken
} from '../../../../infrastructure/clients/pole-emploi-partenaire-client.db'
import { DateService } from '../../../../utils/date-service'
import { fromDemarcheDtoToDemarche } from '../../query-mappers/actions-pole-emploi.mappers'
import { toDemarcheQueryModel } from '../../query-mappers/demarche.mappers'
import { DemarcheQueryModel } from '../../query-models/actions.query-model'

export interface Query {
  idJeune: string
  tri: GetDemarchesQueryGetter.TriQuery
  accessToken: string
  pourConseiller?: boolean
  dateDebut?: DateTime
  idpToken?: string
}

@Injectable()
export class GetDemarchesQueryGetter {
  private logger: Logger
  constructor(
    @Inject(AuthentificationRepositoryToken)
    private readonly authentificationRepository: Authentification.Repository,
    @Inject(PoleEmploiPartenaireClientToken)
    private poleEmploiPartenaireClient: PoleEmploiPartenaireClient,
    private dateService: DateService,
    private authClient: KeycloakClient
  ) {
    this.logger = new Logger('GetDemarchesQueryGetter')
  }

  async handle(query: Query): Promise<Result<Cached<DemarcheQueryModel[]>>> {
    const jeuneUtilisateur = await this.authentificationRepository.getJeuneById(
      query.idJeune
    )
    if (!jeuneUtilisateur?.idAuthentification) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }

    const demarchesDto: ResultApi<DemarcheDto[]> = query.pourConseiller
      ? await this.fetchDemarchesOuCachePourConseiller(
          query,
          jeuneUtilisateur.idAuthentification
        )
      : await this.fetchDemarchesPourJeune(query, jeuneUtilisateur)
    if (isFailure(demarchesDto)) {
      return demarchesDto
    }

    let demarches = demarchesDto.data
      .map(demarcheDto =>
        fromDemarcheDtoToDemarche(demarcheDto, this.dateService)
      )
      .sort(query.tri)

    if (query.dateDebut) {
      demarches = demarches.filter(({ dateDebut, dateFin }) => {
        if (dateDebut) return dateDebut >= query.dateDebut!
        return dateFin >= query.dateDebut!
      })
    }

    const data: Cached<DemarcheQueryModel[]> = {
      queryModel: demarches.map(toDemarcheQueryModel),
      dateDuCache: demarchesDto.dateCache
    }
    return success(data)
  }

  private async fetchDemarchesOuCachePourConseiller(
    query: Query,
    idAuthentificationJeune: string
  ): Promise<ResultApi<DemarcheDto[]>> {
    try {
      const idpToken = await this.authClient.exchangeTokenConseillerJeune(
        query.accessToken,
        idAuthentificationJeune
      )

      return this.poleEmploiPartenaireClient.getDemarches(
        idpToken,
        query.idJeune
      )
    } catch (e) {
      this.logger.warn(
        'Utilisation du cache pour récupérer les démarches du jeune pour son conseiller'
      )
      return this.poleEmploiPartenaireClient.getDemarchesEnCache(query.idJeune)
    }
  }

  private async fetchDemarchesPourJeune(
    query: Query,
    jeuneUtilisateur: Authentification.Utilisateur
  ): Promise<ResultApi<DemarcheDto[]>> {
    const idpToken =
      query.idpToken ??
      (await this.authClient.exchangeTokenJeune(
        query.accessToken,
        jeuneUtilisateur.structure
      ))

    return this.poleEmploiPartenaireClient.getDemarches(idpToken)
  }
}

export namespace GetDemarchesQueryGetter {
  export namespace Tri {
    export function parSatutEtDateFin(
      demarche1: Demarche,
      demarche2: Demarche
    ): number {
      return parStatut(demarche1, demarche2) || parDateFin(demarche1, demarche2)
    }

    export function parDateFin(
      demarche1: Demarche,
      demarche2: Demarche
    ): number {
      return demarche1.dateFin.toMillis() - demarche2.dateFin.toMillis()
    }

    function parStatut(demarche1: Demarche, demarche2: Demarche): number {
      return statutsOrder[demarche1.statut] - statutsOrder[demarche2.statut]
    }

    const statutsOrder: { [statut in Demarche.Statut]: number } = {
      A_FAIRE: 1,
      EN_COURS: 1,
      ANNULEE: 2,
      REALISEE: 2
    }
  }

  export interface TriQuery {
    (demarche1: Demarche, demarche2: Demarche): number
  }
}
