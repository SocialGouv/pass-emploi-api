import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { DateService } from 'src/utils/date-service'
import { NonTrouveError } from '../../../building-blocks/types/domain-error'
import { Cached, Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import {
  Result,
  failure,
  isFailure,
  success
} from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import {
  estPoleEmploiOuCDOuAvenirPro,
  peutVoirLesCampagnes
} from '../../../domain/core'
import { Demarche } from '../../../domain/demarche'
import { Jeune, JeuneRepositoryToken } from '../../../domain/jeune/jeune'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { JeuneAuthorizer } from '../../authorizers/jeune-authorizer'
import { GetFavorisAccueilQueryGetter } from '../query-getters/accueil/get-favoris.query.getter.db'
import { GetRecherchesSauvegardeesQueryGetter } from '../query-getters/accueil/get-recherches-sauvegardees.query.getter.db'
import { GetCampagneQueryGetter } from '../query-getters/get-campagne.query.getter'
import { GetDemarchesQueryGetter } from '../query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from '../query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { AccueilJeunePoleEmploiQueryModel } from '../query-models/jeunes.pole-emploi.query-model'
import { RendezVousJeuneQueryModel } from '../query-models/rendez-vous.query-model'
import { DemarcheQueryModel } from '../query-models/actions.query-model'

export interface GetAccueilJeunePoleEmploiQuery extends Query {
  idJeune: string
  maintenant: string
  accessToken: string
}

@Injectable()
export class GetAccueilJeunePoleEmploiQueryHandler extends QueryHandler<
  GetAccueilJeunePoleEmploiQuery,
  Result<AccueilJeunePoleEmploiQueryModel>
> {
  constructor(
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private jeuneAuthorizer: JeuneAuthorizer,
    private oidcClient: OidcClient,
    private getDemarchesQueryGetter: GetDemarchesQueryGetter,
    private getRendezVousJeunePoleEmploiQueryGetter: GetRendezVousJeunePoleEmploiQueryGetter,
    private getRecherchesSauvegardeesQueryGetter: GetRecherchesSauvegardeesQueryGetter,
    private getFavorisQueryGetter: GetFavorisAccueilQueryGetter,
    private getCampagneQueryGetter: GetCampagneQueryGetter,
    private dateService: DateService
  ) {
    super('GetAccueilJeunePoleEmploiQueryHandler')
  }

  async handle(
    query: GetAccueilJeunePoleEmploiQuery
  ): Promise<Result<AccueilJeunePoleEmploiQueryModel>> {
    const jeune = await this.jeuneRepository.get(query.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }
    const idpToken = await this.oidcClient.exchangeTokenJeune(
      query.accessToken,
      jeune.structure
    )

    const maintenant = DateTime.fromISO(query.maintenant, {
      setZone: true
    })
    const dateDebutDeSemaine = maintenant.startOf('week')
    const dateFinDeSemaine = maintenant.endOf('week')

    const [
      resultDemarches,
      resultRendezVous,
      alertesQueryModels,
      favorisQueryModels,
      campagneQueryModel
    ] = await Promise.all([
      this.getDemarchesQueryGetter.handle({
        ...query,
        tri: GetDemarchesQueryGetter.Tri.parDateFin,
        idpToken
      }),
      this.getRendezVousJeunePoleEmploiQueryGetter.handle({
        ...query,
        idpToken,
        dateDebut: this.dateService.now()
      }),
      this.getRecherchesSauvegardeesQueryGetter
        .handle({
          idJeune: query.idJeune
        })
        .catch(e => {
          this.logger.error(e)
          donneesManquantes.push('Alertes')
          return []
        }),
      this.getFavorisQueryGetter
        .handle({
          idJeune: query.idJeune
        })
        .catch(e => {
          this.logger.error(e)
          donneesManquantes.push('Favoris')
          return []
        }),
      peutVoirLesCampagnes(jeune.structure)
        ? this.getCampagneQueryGetter
            .handle({ idJeune: query.idJeune })
            .catch(e => {
              this.logger.error(e)
              return undefined
            })
        : Promise.resolve(undefined)
    ])

    const donneesManquantes: string[] = []
    let demarches: Cached<DemarcheQueryModel[]>
    let rendezVous: Cached<RendezVousJeuneQueryModel[]>

    if (isFailure(resultRendezVous)) {
      donneesManquantes.push('Rendez-vous')
      rendezVous = { queryModel: [] }
    } else {
      rendezVous = resultRendezVous.data
    }
    if (isFailure(resultDemarches)) {
      donneesManquantes.push('Démarches')
      demarches = { queryModel: [] }
    } else {
      demarches = resultDemarches.data
    }

    const nombreDeRendezVous = rendezVous.queryModel.filter(
      unRendezVous =>
        unRendezVous.date >= maintenant.toJSDate() &&
        unRendezVous.date <= dateFinDeSemaine.toJSDate()
    ).length

    const nombreDeDemarchesARealiser = demarches.queryModel.filter(
      demarche =>
        DateTime.fromISO(demarche.dateFin) >= maintenant &&
        DateTime.fromISO(demarche.dateFin) <= dateFinDeSemaine &&
        demarche.statut !== Demarche.Statut.REALISEE &&
        demarche.statut !== Demarche.Statut.ANNULEE
    ).length
    const nombreDeDemarchesEnRetard = demarches.queryModel.filter(
      demarche =>
        DateTime.fromISO(demarche.dateFin) <= maintenant &&
        demarche.statut !== Demarche.Statut.REALISEE &&
        demarche.statut !== Demarche.Statut.ANNULEE
    ).length
    const nombreDeDemarchesAFaireSemaineCalendaire =
      demarches.queryModel.filter(
        demarche =>
          DateTime.fromISO(demarche.dateFin) >= dateDebutDeSemaine &&
          DateTime.fromISO(demarche.dateFin) <= dateFinDeSemaine &&
          demarche.statut !== Demarche.Statut.REALISEE &&
          demarche.statut !== Demarche.Statut.ANNULEE
      ).length

    const prochainRendezVous =
      rendezVous.queryModel.length > 0
        ? rendezVous.queryModel.filter(
            rdv => rdv.date >= maintenant.toJSDate()
          )[0]
        : undefined

    const data: AccueilJeunePoleEmploiQueryModel = {
      dateDerniereMiseAJour: recupererLaDateLaPlusAncienne(
        demarches.dateDuCache,
        rendezVous.dateDuCache
      )?.toISO(),
      cetteSemaine: {
        nombreRendezVous: nombreDeRendezVous,
        nombreActionsDemarchesEnRetard: nombreDeDemarchesEnRetard,
        nombreActionsDemarchesARealiser: nombreDeDemarchesARealiser,
        nombreActionsDemarchesAFaireSemaineCalendaire:
          nombreDeDemarchesAFaireSemaineCalendaire
      },
      prochainRendezVous,
      mesAlertes: alertesQueryModels,
      mesFavoris: favorisQueryModels,
      campagne: campagneQueryModel
    }

    if (donneesManquantes.length)
      data.messageDonneesManquantes = `Les données suivantes sont temporairement indisponibles : ${donneesManquantes.join(
        ', '
      )}`

    return success(data)
  }

  async authorize(
    query: GetAccueilJeunePoleEmploiQuery,
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
  dateUne?: DateTime,
  dateDeux?: DateTime
): DateTime | undefined {
  if (!dateUne) {
    return dateDeux
  }

  if (!dateDeux) {
    return dateUne
  }

  return dateUne < dateDeux ? dateUne : dateDeux
}
