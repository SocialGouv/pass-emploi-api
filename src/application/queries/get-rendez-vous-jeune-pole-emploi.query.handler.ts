import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import {
  ErreurHttp,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { failure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  PoleEmploiPartenaireClient,
  PrestationDto,
  RendezVousPoleEmploiDto
} from '../../infrastructure/clients/pole-emploi-partenaire-client'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { fromRendezVousDtoToRendezVousQueryModel } from './query-mappers/rendez-vous-pole-emploi.mappers'
import { fromPrestationDtoToRendezVousQueryModel } from './query-mappers/rendez-vous-prestation.mappers'
import { RendezVousQueryModel } from './query-models/rendez-vous.query-models'

export interface GetRendezVousJeunePoleEmploiQuery extends Query {
  idJeune: string
  idpToken: string
}

@Injectable()
export class GetRendezVousJeunePoleEmploiQueryHandler extends QueryHandler<
  GetRendezVousJeunePoleEmploiQuery,
  Result<RendezVousQueryModel[]>
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private poleEmploiPartenaireClient: PoleEmploiPartenaireClient,
    private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer,
    private dateService: DateService,
    private idService: IdService
  ) {
    super('GetRendezVousJeunePoleEmploiQueryHandler')
  }

  async handle(
    query: GetRendezVousJeunePoleEmploiQuery
  ): Promise<Result<RendezVousQueryModel[]>> {
    const jeune = await this.jeuneRepository.get(query.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }

    const maintenant = this.dateService.now()

    try {
      const [responsePrestations, responseRendezVous] = await Promise.all([
        await this.poleEmploiPartenaireClient.getPrestations(
          query.idpToken,
          maintenant
        ),
        await this.poleEmploiPartenaireClient.getRendezVous(query.idpToken)
      ])

      const prestations: PrestationDto[] = responsePrestations?.data ?? []
      const rendezVousPoleEmploiDto: RendezVousPoleEmploiDto[] =
        responseRendezVous?.data ?? []

      const rendezVousPrestations = await Promise.all(
        prestations.map(async prestation => {
          const dateRendezVous = DateTime.fromJSDate(
            prestation.session.dateDebut
          )
          let lienVisio = undefined

          if (
            prestation.identifiantStable &&
            this.dateService.isSameDateDay(dateRendezVous, maintenant)
          ) {
            const responseLienVisio =
              await this.poleEmploiPartenaireClient.getLienVisio(
                query.idpToken,
                prestation.identifiantStable
              )
            lienVisio = responseLienVisio?.data
          }

          return fromPrestationDtoToRendezVousQueryModel(
            prestation,
            jeune,
            this.idService,
            lienVisio
          )
        })
      )
      const rendezVousPoleEmploi = rendezVousPoleEmploiDto.map(rendezVous => {
        return fromRendezVousDtoToRendezVousQueryModel(
          rendezVous,
          jeune,
          this.idService
        )
      })

      return success(rendezVousPrestations.concat(rendezVousPoleEmploi))
    } catch (e) {
      this.logger.error(e)
      return failure(
        new ErreurHttp(e.response?.data?.message, e.response?.status)
      )
    }
  }

  async authorize(
    query: GetRendezVousJeunePoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.jeunePoleEmploiAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
