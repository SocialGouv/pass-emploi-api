import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { DateService } from 'src/utils/date-service'
import { NonTrouveError } from '../../../building-blocks/types/domain-error'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import {
  Result,
  failure,
  isFailure,
  success
} from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { estBRSA, estPoleEmploiBRSA } from '../../../domain/core'
import { Demarche } from '../../../domain/demarche'
import { Jeune, JeuneRepositoryToken } from '../../../domain/jeune/jeune'
import { KeycloakClient } from '../../../infrastructure/clients/keycloak-client.db'
import { JeuneAuthorizer } from '../../authorizers/jeune-authorizer'
import { GetFavorisAccueilQueryGetter } from '../query-getters/accueil/get-favoris.query.getter.db'
import { GetRecherchesSauvegardeesQueryGetter } from '../query-getters/accueil/get-recherches-sauvegardees.query.getter.db'
import { GetDemarchesQueryGetter } from '../query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from '../query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { AccueilJeunePoleEmploiQueryModel } from '../query-models/jeunes.pole-emploi.query-model'
import { GetCampagneQueryGetter } from '../query-getters/get-campagne.query.getter'

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
    private keycloakClient: KeycloakClient,
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
    const idpToken = await this.keycloakClient.exchangeTokenJeune(
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
      this.getRecherchesSauvegardeesQueryGetter.handle({
        idJeune: query.idJeune
      }),
      this.getFavorisQueryGetter.handle({
        idJeune: query.idJeune
      }),
      estBRSA(jeune.structure)
        ? Promise.resolve(undefined)
        : this.getCampagneQueryGetter.handle({ idJeune: query.idJeune })
    ])

    if (isFailure(resultDemarches)) {
      return resultDemarches
    }

    if (isFailure(resultRendezVous)) {
      return resultRendezVous
    }

    const nombreDeRendezVous = resultRendezVous.data.queryModel.filter(
      unRendezVous =>
        unRendezVous.date >= maintenant.toJSDate() &&
        unRendezVous.date <= dateFinDeSemaine.toJSDate()
    ).length

    const nombreDeDemarchesARealiser = resultDemarches.data.queryModel.filter(
      demarche =>
        DateTime.fromISO(demarche.dateFin) >= maintenant &&
        DateTime.fromISO(demarche.dateFin) <= dateFinDeSemaine &&
        demarche.statut !== Demarche.Statut.REALISEE &&
        demarche.statut !== Demarche.Statut.ANNULEE
    ).length
    const nombreDeDemarchesEnRetard = resultDemarches.data.queryModel.filter(
      demarche =>
        DateTime.fromISO(demarche.dateFin) <= maintenant &&
        demarche.statut !== Demarche.Statut.REALISEE &&
        demarche.statut !== Demarche.Statut.ANNULEE
    ).length
    const nombreDeDemarchesAFaireSemaineCalendaire =
      resultDemarches.data.queryModel.filter(
        demarche =>
          DateTime.fromISO(demarche.dateFin) >= dateDebutDeSemaine &&
          DateTime.fromISO(demarche.dateFin) <= dateFinDeSemaine &&
          demarche.statut !== Demarche.Statut.REALISEE &&
          demarche.statut !== Demarche.Statut.ANNULEE
      ).length

    const prochainRendezVous =
      resultRendezVous.data.queryModel.length > 0
        ? resultRendezVous.data.queryModel.filter(
            rdv => rdv.date >= maintenant.toJSDate()
          )[0]
        : undefined
    let dateDerniereMiseAJour: string | undefined = undefined
    if (resultDemarches.data.dateDuCache && resultRendezVous.data.dateDuCache) {
      dateDerniereMiseAJour = recupererLaDateLaPlusAncienne(
        resultDemarches.data.dateDuCache,
        resultRendezVous.data.dateDuCache
      ).toISO()
    }

    const data: AccueilJeunePoleEmploiQueryModel = {
      dateDerniereMiseAJour,
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
    return success(data)
  }

  async authorize(
    query: GetAccueilJeunePoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      query.idJeune,
      utilisateur,
      estPoleEmploiBRSA(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}

function recupererLaDateLaPlusAncienne(
  dateUne: DateTime,
  dateDeux: DateTime
): DateTime {
  if (!dateUne) {
    return dateDeux
  }

  if (!dateDeux) {
    return dateUne
  }

  return dateUne < dateDeux ? dateUne : dateDeux
}
