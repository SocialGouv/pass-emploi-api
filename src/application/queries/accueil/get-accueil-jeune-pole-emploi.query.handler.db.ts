import {
  failure,
  isFailure,
  Result,
  success
} from '../../../building-blocks/types/result'
import { Injectable } from '@nestjs/common'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { GetDemarchesQueryGetter } from '../query-getters/pole-emploi/get-demarches.query.getter'
import { AccueilJeunePoleEmploiQueryModel } from '../query-models/jeunes.pole-emploi.query-model'
import { DateTime } from 'luxon'
import { Demarche } from '../../../domain/demarche'
import { DroitsInsuffisants } from '../../../building-blocks/types/domain-error'
import { GetRendezVousJeunePoleEmploiQueryGetter } from '../query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { Authentification } from '../../../domain/authentification'
import { KeycloakClient } from '../../../infrastructure/clients/keycloak-client'
import { JeunePoleEmploiAuthorizer } from '../../authorizers/authorize-jeune-pole-emploi'
import { Core } from '../../../domain/core'
import { Query } from '../../../building-blocks/types/query'
import { GetRecherchesSauvegardeesQueryGetter } from '../query-getters/accueil/get-recherches-sauvegardees.query.getter.db'

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
    private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer,
    private keycloakClient: KeycloakClient,
    private getDemarchesQueryGetter: GetDemarchesQueryGetter,
    private getRendezVousJeunePoleEmploiQueryGetter: GetRendezVousJeunePoleEmploiQueryGetter,
    private getRecherchesSauvegardeesQueryGetter: GetRecherchesSauvegardeesQueryGetter
  ) {
    super('GetAccueilJeunePoleEmploiQueryHandler')
  }

  async handle(
    query: GetAccueilJeunePoleEmploiQuery
  ): Promise<Result<AccueilJeunePoleEmploiQueryModel>> {
    const dateFinDeSemaine = DateTime.fromISO(query.maintenant, {
      setZone: true
    }).endOf('week')

    const maintenant = DateTime.fromISO(query.maintenant, {
      setZone: true
    })

    const idpToken = await this.keycloakClient.exchangeTokenPoleEmploiJeune(
      query.accessToken
    )

    const [resultDemarches, resultRendezVous, rechercheSqlModelsAlertes] =
      await Promise.all([
        this.getDemarchesQueryGetter.handle({
          ...query,
          tri: GetDemarchesQueryGetter.Tri.parDateFin,
          idpToken
        }),
        this.getRendezVousJeunePoleEmploiQueryGetter.handle({
          ...query,
          idpToken
        }),
        this.getRecherchesSauvegardeesQueryGetter.handle({
          idJeune: query.idJeune
        })
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

    const nombreDedemarchesARealiser = resultDemarches.data.queryModel.filter(
      demarche =>
        DateTime.fromISO(demarche.dateFin) >= maintenant &&
        DateTime.fromISO(demarche.dateFin) <= dateFinDeSemaine
    ).length
    const nombreDeDemarchesEnRetard = resultDemarches.data.queryModel.filter(
      demarche =>
        DateTime.fromISO(demarche.dateFin) <= maintenant &&
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
        nombreActionsDemarchesARealiser: nombreDedemarchesARealiser
      },
      prochainRendezVous,
      mesAlertes: rechercheSqlModelsAlertes,
      mesFavoris: []
    }
    return success(data)
  }

  async authorize(
    query: GetAccueilJeunePoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.structure === Core.Structure.POLE_EMPLOI) {
      return this.jeunePoleEmploiAuthorizer.authorize(
        query.idJeune,
        utilisateur
      )
    }
    return failure(new DroitsInsuffisants())
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