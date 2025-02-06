import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { DateService } from 'src/utils/date-service'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { Cached, Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { estPoleEmploiOuCDOuAvenirPro } from '../../domain/core'
import { Demarche } from '../../domain/demarche'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { GetDemarchesQueryGetter } from './query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from './query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { SuiviSemainePoleEmploiQueryModel } from './query-models/home-jeune-suivi.query-model'

export interface GetSuiviSemainePoleEmploiQuery extends Query {
  idJeune: string
  accessToken: string
  maintenant: DateTime
}

@Injectable()
export class GetSuiviSemainePoleEmploiQueryHandler extends QueryHandler<
  GetSuiviSemainePoleEmploiQuery,
  Result<Cached<SuiviSemainePoleEmploiQueryModel>>
> {
  constructor(
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private getDemarchesQueryGetter: GetDemarchesQueryGetter,
    private getRendezVousJeunePoleEmploiQueryGetter: GetRendezVousJeunePoleEmploiQueryGetter,
    private jeuneAuthorizer: JeuneAuthorizer,
    private oidcClient: OidcClient,
    private dateService: DateService
  ) {
    super('GetSuiviSemainePoleEmploiQueryHandler')
  }

  async handle(
    query: GetSuiviSemainePoleEmploiQuery
  ): Promise<Result<Cached<SuiviSemainePoleEmploiQueryModel>>> {
    const jeune = await this.jeuneRepository.get(query.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }
    const idpToken = await this.oidcClient.exchangeTokenJeune(
      query.accessToken,
      jeune.structure
    )

    const lundiPasse = query.maintenant.startOf('week')
    const dimancheEnHuit = query.maintenant.endOf('week').plus({ week: 1 })

    const [resultDemarches, resultRendezVous] = await Promise.all([
      this.getDemarchesQueryGetter.handle({
        ...query,
        tri: GetDemarchesQueryGetter.Tri.parDateFin,
        idpToken
      }),
      this.getRendezVousJeunePoleEmploiQueryGetter.handle({
        ...query,
        idpToken,
        dateFin: this.dateService.now()
      })
    ])

    if (isFailure(resultDemarches)) {
      return resultDemarches
    }

    if (isFailure(resultRendezVous)) {
      return resultRendezVous
    }

    const demarches = resultDemarches.data.queryModel.filter(
      demarche =>
        DateTime.fromISO(demarche.dateFin) >= lundiPasse &&
        DateTime.fromISO(demarche.dateFin) <= dimancheEnHuit
    )
    const rendezVous = resultRendezVous.data.queryModel.filter(
      unRendezVous =>
        unRendezVous.date >= lundiPasse.toJSDate() &&
        unRendezVous.date <= dimancheEnHuit.toJSDate()
    )
    const nombreDeDemarchesEnRetard = resultDemarches.data.queryModel.filter(
      demarche =>
        DateTime.fromISO(demarche.dateFin) <= query.maintenant &&
        demarche.statut !== Demarche.Statut.REALISEE &&
        demarche.statut !== Demarche.Statut.ANNULEE
    ).length

    const data: Cached<SuiviSemainePoleEmploiQueryModel> = {
      queryModel: {
        demarches,
        rendezVous,
        metadata: {
          dateDeDebut: lundiPasse.toJSDate(),
          dateDeFin: dimancheEnHuit.toJSDate(),
          demarchesEnRetard: nombreDeDemarchesEnRetard
        }
      },
      dateDuCache: recupererLaDateLaPlusAncienne(
        resultDemarches.data.dateDuCache,
        resultRendezVous.data.dateDuCache
      )
    }
    return success(data)
  }

  async authorize(
    query: GetSuiviSemainePoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      query.idJeune,
      utilisateur,
      estPoleEmploiOuCDOuAvenirPro(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
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
