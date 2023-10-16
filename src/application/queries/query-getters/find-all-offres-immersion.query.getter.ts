import { Inject, Injectable } from '@nestjs/common'
import {
  isFailure,
  Result,
  success
} from '../../../building-blocks/types/result'
import { OffreImmersionQueryModel } from '../query-models/offres-immersion.query-model'
import { URLSearchParams } from 'url'
import { toOffreImmersionQueryModel } from '../../../infrastructure/repositories/mappers/offres-immersion.mappers'
import { ImmersionClient } from '../../../infrastructure/clients/immersion-client'
import { GetOffresImmersionQuery } from '../get-offres-immersion.query.handler'
import { Offre } from '../../../domain/offre/offre'
import { QueryTypes, Sequelize } from 'sequelize'
import { SequelizeInjectionToken } from '../../../infrastructure/sequelize/providers'

@Injectable()
export class FindAllOffresImmersionQueryGetter {
  constructor(
    private immersionClient: ImmersionClient,
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {}

  async handle(
    query: GetOffresImmersionQuery
  ): Promise<Result<OffreImmersionQueryModel[]>> {
    const params = await this.queryConstructor(query)

    const offresImmersion = await this.immersionClient.getOffres(params)

    if (isFailure(offresImmersion)) {
      return offresImmersion
    }

    return success(offresImmersion.data.map(toOffreImmersionQueryModel))
  }

  async queryConstructor(
    query: GetOffresImmersionQuery
  ): Promise<URLSearchParams> {
    const distanceAvecDefault = query.distance
      ? query.distance.toString()
      : Offre.Recherche.DISTANCE_PAR_DEFAUT.toString()

    const params = new URLSearchParams()

    const appellationCodeListe = await this.romeToAppellationsCode(query.rome)

    params.append('distanceKm', distanceAvecDefault)
    params.append('longitude', query.lon.toString())
    params.append('latitude', query.lat.toString())
    appellationCodeListe.forEach(appellationCode => {
      params.append('appellationCodes[]', appellationCode)
    })
    params.append('sortedBy', 'date')
    params.append('voluntaryToImmersion', 'true')

    return params
  }

  async romeToAppellationsCode(codeRome: string): Promise<string[]> {
    const metiers: Array<{ appellation_code: string }> =
      await this.sequelize.query(
        `SELECT appellation_code
       FROM referentiel_metier_rome
       WHERE code = ?
       AND  appellation_code != ''
       ORDER BY libelle DESC`,
        {
          replacements: [codeRome],
          type: QueryTypes.SELECT
        }
      )

    const appellationCodeListe: string[] = metiers.map(m => m.appellation_code)

    return appellationCodeListe
  }
}
