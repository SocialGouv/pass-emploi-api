import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  PrestationDto,
  RendezVousPoleEmploiDto
} from '../../../../infrastructure/clients/dto/pole-emploi.dto'
import { Jeune, JeunesRepositoryToken } from '../../../../domain/jeune/jeune'
import { DateTime } from 'luxon'
import {
  buildDateSansTimezone,
  fromPrestationDtoToRendezVousQueryModel
} from '../../query-mappers/rendez-vous-prestation.mappers'
import { DateService } from '../../../../utils/date-service'
import { IdService } from '../../../../utils/id-service'
import {
  failure,
  Result,
  success
} from '../../../../building-blocks/types/result'
import {
  ErreurHttp,
  NonTrouveError
} from '../../../../building-blocks/types/domain-error'
import { RendezVousJeuneQueryModel } from '../../query-models/rendez-vous.query-model'
import { fromRendezVousDtoToRendezVousQueryModel } from '../../query-mappers/rendez-vous-pole-emploi.mappers'
import {
  PoleEmploiPartenaire,
  PoleEmploiPartenaireClient
} from '../../../../infrastructure/clients/pole-emploi-partenaire-client'
import { RendezVous } from '../../../../domain/rendez-vous'
import { KeycloakClient } from '../../../../infrastructure/clients/keycloak-client'
import { buildError } from '../../../../utils/logger.module'

export interface Query {
  idJeune: string
  accessToken: string
  periode?: RendezVous.Periode
}

@Injectable()
export class GetRendezVousJeunePoleEmploiQueryGetter {
  private logger: Logger

  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(PoleEmploiPartenaire.PoleEmploiPartenaireClientToken)
    private poleEmploiPartenaireClient: PoleEmploiPartenaireClient,
    private dateService: DateService,
    private idService: IdService,
    private keycloakClient: KeycloakClient
  ) {
    this.logger = new Logger('GetRendezVousJeunePoleEmploiQueryGetter')
  }

  async handle(query: Query): Promise<Result<RendezVousJeuneQueryModel[]>> {
    const jeune = await this.jeuneRepository.get(query.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }

    if (query.periode === RendezVous.Periode.PASSES) {
      return success([])
    }

    const maintenant = this.dateService.now()
    const idpToken = await this.keycloakClient.exchangeTokenPoleEmploiJeune(
      query.accessToken
    )

    try {
      const [responsePrestations, responseRendezVous] = await Promise.all([
        this.poleEmploiPartenaireClient.getPrestations(idpToken, maintenant),
        this.poleEmploiPartenaireClient.getRendezVous(idpToken)
      ])

      const prestations: PrestationDto[] = responsePrestations?.data ?? []
      const rendezVousPoleEmploiDto: RendezVousPoleEmploiDto[] =
        responseRendezVous?.data ?? []

      const rendezVousPrestations = await Promise.all(
        prestations
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
              try {
                const responseLienVisio =
                  await this.poleEmploiPartenaireClient.getLienVisio(
                    idpToken,
                    prestation.identifiantStable!
                  )
                lienVisio = responseLienVisio?.data
              } catch (e) {
                this.logger.error(
                  buildError('Impossible de récupérer le lien de la visio', e)
                )
              }
            }

            try {
              return fromPrestationDtoToRendezVousQueryModel(
                prestation,
                jeune,
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
      const rendezVousPoleEmploi = rendezVousPoleEmploiDto.map(rendezVous => {
        return fromRendezVousDtoToRendezVousQueryModel(
          rendezVous,
          jeune,
          this.idService
        )
      })

      const rendezVousDuJeune = rendezVousPrestations
        .concat(rendezVousPoleEmploi)
        .sort(sortRendezVousByDate)

      return success(rendezVousDuJeune)
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
