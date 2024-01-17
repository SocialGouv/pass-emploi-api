import { Inject, Injectable, Logger } from '@nestjs/common'
import { DateTime } from 'luxon'
import { NonTrouveError } from '../../../../building-blocks/types/domain-error'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../../../building-blocks/types/result'
import { Jeune, JeuneRepositoryToken } from '../../../../domain/jeune/jeune'
import { RendezVous } from '../../../../domain/rendez-vous/rendez-vous'
import { KeycloakClient } from '../../../../infrastructure/clients/keycloak-client'
import {
  PoleEmploiPartenaireClient,
  PoleEmploiPartenaireClientToken
} from '../../../../infrastructure/clients/pole-emploi-partenaire-client.db'
import { DateService } from '../../../../utils/date-service'
import { IdService } from '../../../../utils/id-service'
import { fromRendezVousDtoToRendezVousQueryModel } from '../../query-mappers/rendez-vous-pole-emploi.mappers'
import {
  buildDateSansTimezone,
  fromPrestationDtoToRendezVousQueryModel
} from '../../query-mappers/rendez-vous-prestation.mappers'
import { RendezVousJeuneQueryModel } from '../../query-models/rendez-vous.query-model'
import { Cached } from '../../../../building-blocks/types/query'

export interface Query {
  idJeune: string
  periode?: RendezVous.Periode
  accessToken: string
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
    private dateService: DateService,
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

    const maintenant = this.dateService.now()
    let responsePrestations
    let responseRendezVous

    if (query.periode === RendezVous.Periode.PASSES) {
      ;[responsePrestations, responseRendezVous] = await Promise.all([
        this.poleEmploiPartenaireClient.getPrestations(
          idpToken,
          jeune.creationDate
        ),
        this.poleEmploiPartenaireClient.getRendezVousPasses(
          idpToken,
          jeune.creationDate.toUTC()
        )
      ])
    } else {
      ;[responsePrestations, responseRendezVous] = await Promise.all([
        this.poleEmploiPartenaireClient.getPrestations(idpToken, maintenant),
        this.poleEmploiPartenaireClient.getRendezVous(idpToken)
      ])
    }

    if (isFailure(responsePrestations)) {
      return responsePrestations
    }

    let rendezVousPrestations = await Promise.all(
      responsePrestations.data
        .filter(prestation => !prestation.annule)
        .map(async prestation => {
          const dateRendezVous = DateTime.fromJSDate(
            buildDateSansTimezone(prestation.session.dateDebut)
          )
          const avecVisio =
            prestation.session.natureAnimation === 'INTERNE' ||
            prestation.session.modalitePremierRendezVous === 'WEBCAM'
          let lienVisio = undefined

          const laVisioEstDisponible =
            avecVisio &&
            prestation.identifiantStable &&
            DateService.isSameDateDay(dateRendezVous, maintenant)

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

    if (query.periode === RendezVous.Periode.PASSES) {
      rendezVousPrestations = rendezVousPrestations.filter(prestations =>
        DateService.isGreater(
          maintenant,
          DateService.fromJSDateToDateTime(prestations.date)!
        )
      )
    }

    const rendezVousDuJeune = rendezVousPrestations
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
