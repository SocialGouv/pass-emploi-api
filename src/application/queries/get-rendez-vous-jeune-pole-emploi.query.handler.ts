import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import {
  ErreurHttp,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { failure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import { RendezVous } from 'src/domain/rendez-vous'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { KeycloakClient } from '../../infrastructure/clients/keycloak-client'
import { PoleEmploiPartenaireClient } from '../../infrastructure/clients/pole-emploi-partenaire-client'
import { buildError } from '../../utils/logger.module'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { fromRendezVousDtoToRendezVousQueryModel } from './query-mappers/rendez-vous-pole-emploi.mappers'
import {
  buildDateSansTimezone,
  fromPrestationDtoToRendezVousQueryModel
} from './query-mappers/rendez-vous-prestation.mappers'
import { RendezVousJeuneQueryModel } from './query-models/rendez-vous.query-model'
import {
  PrestationDto,
  RendezVousPoleEmploiDto
} from '../../infrastructure/clients/dto/pole-emploi.dto'

export interface GetRendezVousJeunePoleEmploiQuery extends Query {
  idJeune: string
  accessToken: string
  periode?: RendezVous.Periode
}

@Injectable()
export class GetRendezVousJeunePoleEmploiQueryHandler extends QueryHandler<
  GetRendezVousJeunePoleEmploiQuery,
  Result<RendezVousJeuneQueryModel[]>
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private poleEmploiPartenaireClient: PoleEmploiPartenaireClient,
    private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer,
    private dateService: DateService,
    private idService: IdService,
    private keycloakClient: KeycloakClient,
    private evenementService: EvenementService
  ) {
    super('GetRendezVousJeunePoleEmploiQueryHandler')
  }

  async handle(
    query: GetRendezVousJeunePoleEmploiQuery
  ): Promise<Result<RendezVousJeuneQueryModel[]>> {
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
        prestations.map(async prestation => {
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
            this.dateService.isSameDateDay(dateRendezVous, maintenant)

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

          // TODO en attente du contract testing
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

  async authorize(
    query: GetRendezVousJeunePoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeunePoleEmploiAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    query: GetRendezVousJeunePoleEmploiQuery
  ): Promise<void> {
    if (query?.periode !== RendezVous.Periode.PASSES) {
      await this.evenementService.creerEvenement(
        Evenement.Type.RDV_LISTE,
        utilisateur
      )
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
