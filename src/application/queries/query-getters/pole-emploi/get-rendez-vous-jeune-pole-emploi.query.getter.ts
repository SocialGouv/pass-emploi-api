import { Inject, Injectable, Logger } from '@nestjs/common'
import { DateTime } from 'luxon'
import { NonTrouveError } from '../../../../building-blocks/types/domain-error'
import { Cached } from '../../../../building-blocks/types/query'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../../../building-blocks/types/result'
import { Jeune, JeuneRepositoryToken } from '../../../../domain/jeune/jeune'
import { KeycloakClient } from '../../../../infrastructure/clients/keycloak-client'
import {
  PoleEmploiPartenaireClient,
  PoleEmploiPartenaireClientToken
} from '../../../../infrastructure/clients/pole-emploi-partenaire-client.db'
import { DateService } from '../../../../utils/date-service'
import { IdService } from '../../../../utils/id-service'
import { fromRendezVousDtoToRendezVousQueryModel } from '../../query-mappers/rendez-vous-pole-emploi.mappers'
import { fromPrestationDtoToRendezVousQueryModel } from '../../query-mappers/rendez-vous-prestation.mappers'
import { RendezVousJeuneQueryModel } from '../../query-models/rendez-vous.query-model'

export interface Query {
  idJeune: string
  accessToken: string
  dateDebut?: DateTime
  dateFin?: DateTime
  idpToken?: string
}

@Injectable()
export class GetRendezVousJeunePoleEmploiQueryGetter {
  private logger: Logger

  constructor(
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(PoleEmploiPartenaireClientToken)
    private poleEmploiPartenaireClient: PoleEmploiPartenaireClient,
    private idService: IdService,
    private keycloakClient: KeycloakClient
  ) {
    this.logger = new Logger('GetRendezVousJeunePoleEmploiQueryGetter')
  }

  async handle(
    query: Query
  ): Promise<Result<Cached<RendezVousJeuneQueryModel[]>>> {
    const jeune = await this.jeuneRepository.get(query.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }
    const idpToken =
      query.idpToken ??
      (await this.keycloakClient.exchangeTokenJeune(
        query.accessToken,
        jeune.structure
      ))

    const dateDebut = query.dateDebut ?? jeune.creationDate
    const [responsePrestations, responseRendezVous] = await Promise.all([
      this.poleEmploiPartenaireClient.getPrestations(idpToken, dateDebut),
      this.poleEmploiPartenaireClient.getRendezVous(idpToken, dateDebut)
    ])

    if (isFailure(responsePrestations)) {
      return responsePrestations
    }

    const rendezVousPrestations = await Promise.all(
      responsePrestations.data
        .filter(prestation => !prestation.annule)
        .map(async prestation => {
          const avecVisio =
            prestation.session.natureAnimation === 'INTERNE' ||
            prestation.session.modalitePremierRendezVous === 'WEBCAM'
          let lienVisio = undefined

          const laVisioEstDisponible = avecVisio && prestation.identifiantStable

          if (laVisioEstDisponible) {
            const responseLienVisio =
              await this.poleEmploiPartenaireClient.getLienVisio(
                idpToken,
                prestation.identifiantStable!
              )

            if (isFailure(responseLienVisio)) {
              this.logger.error(responseLienVisio.error)
            } else {
              lienVisio = responseLienVisio.data
            }
          }

          try {
            return fromPrestationDtoToRendezVousQueryModel(
              prestation,
              this.idService,
              lienVisio
            )
          } catch (e) {
            this.logger.error('Impossible de mapper la prestation.')
            this.logger.error(prestation)
            throw e
          }
        })
    )

    const rendezVousPoleEmploi = isFailure(responseRendezVous)
      ? []
      : responseRendezVous.data.map(rendezVous => {
          return fromRendezVousDtoToRendezVousQueryModel(
            rendezVous,
            this.idService
          )
        })

    const rendezVousPrestationsFiltres = query.dateFin
      ? rendezVousPrestations.filter(prestations =>
          DateService.isGreater(
            query.dateFin!,
            DateService.fromJSDateToDateTime(prestations.date)!
          )
        )
      : rendezVousPrestations

    const rendezVousDuJeune = rendezVousPrestationsFiltres
      .concat(rendezVousPoleEmploi)
      .sort(sortRendezVousByDate)

    const data: Cached<RendezVousJeuneQueryModel[]> = {
      queryModel: rendezVousDuJeune,
      dateDuCache: recupererLaDateLaPlusAncienne(
        responsePrestations.dateCache,
        isFailure(responseRendezVous) ? undefined : responseRendezVous.dateCache
      )
    }
    return success(data)
  }
}

function recupererLaDateLaPlusAncienne(
  dateUne: DateTime | undefined,
  dateDeux: DateTime | undefined
): DateTime | undefined {
  if (!dateUne) {
    return dateDeux
  }

  if (!dateDeux) {
    return dateUne
  }

  return dateUne < dateDeux ? dateUne : dateDeux
}

function sortRendezVousByDate(
  rdv1: RendezVousJeuneQueryModel,
  rdv2: RendezVousJeuneQueryModel
): number {
  const date1 = new Date(rdv1.date).getTime()
  const date2 = new Date(rdv2.date).getTime()

  if (date1 < date2) return -1
  if (date1 > date2) return 1
  return 0
}
