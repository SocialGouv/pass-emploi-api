import { Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'

import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { DateTime } from 'luxon'
import { GetDemarchesQueryGetter } from './query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from './query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { Demarche } from 'src/domain/demarche'
import { AccueilJeuneQueryModel } from './query-models/jeunes.query-model'

interface GetAccueilJeunePoleEmploiQuery extends Query {
  idJeune: string
  maintenant: string
  accessToken: string
}

@Injectable()
export class GetAccueilJeunePoleEmploiQueryHandler extends QueryHandler<
  GetAccueilJeunePoleEmploiQuery,
  Result<AccueilJeuneQueryModel>
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    private keycloakClient: KeycloakClient,
    private getDemarchesQueryGetter: GetDemarchesQueryGetter,
    private getRendezVousJeunePoleEmploiQueryGetter: GetRendezVousJeunePoleEmploiQueryGetter
  ) {
    super('GetAccueilJeunePoleEmploiQueryHandler')
  }

  async handle(
    query: GetAccueilJeunePoleEmploiQuery
  ): Promise<Result<AccueilJeuneQueryModel>> {
    const dateFinDeSemaine = DateTime.fromISO(query.maintenant, {
      setZone: true
    }).endOf('week')

    const maintenant = DateTime.fromISO(query.maintenant, {
      setZone: true
    })

    const idpToken = await this.keycloakClient.exchangeTokenPoleEmploiJeune(
      query.accessToken
    )

    const [resultDemarches, resultRendezVous] = await Promise.all([
      this.getDemarchesQueryGetter.handle({
        ...query,
        tri: GetDemarchesQueryGetter.Tri.parDateFin,
        idpToken
      }),
      this.getRendezVousJeunePoleEmploiQueryGetter.handle({
        ...query,
        idpToken
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

    let dateLaPlusAncienne: string | undefined
    if (resultDemarches.data.dateDuCache && resultRendezVous.data.dateDuCache) {
      dateLaPlusAncienne = recupererLaDateLaPlusAncienne(
        resultDemarches.data.dateDuCache,
        resultRendezVous.data.dateDuCache
      ).toISO()
    } else {
      dateLaPlusAncienne = undefined
    }

    const data: AccueilJeuneQueryModel = {
      dateDerniereMiseAJour: dateLaPlusAncienne,
      cetteSemaine: {
        nombreRendezVous: nombreDeRendezVous,
        nombreActionsDemarchesEnRetard: nombreDeDemarchesEnRetard,
        nombreActionsDemarchesARealiser: nombreDedemarchesARealiser
      },
      prochainRendezVous: nombreDeRendezVous
        ? undefined
        : resultRendezVous.data.queryModel[0],
      evenementsAVenir: [],
      mesAlertes: [],
      mesFavoris: []
    }
    return success(data)
  }

  async authorize(
    query: GetAccueilJeunePoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (
      utilisateur.structure === Core.Structure.POLE_EMPLOI ||
      utilisateur.structure === Core.Structure.PASS_EMPLOI
    ) {
      return this.jeuneAuthorizer.authorizeJeune(query.idJeune, utilisateur)
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
