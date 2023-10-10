import { Inject, Injectable } from '@nestjs/common'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { OffreImmersionQueryModel } from '../query-models/offres-immersion.query-model'
import { URLSearchParams } from 'url'
import { PartenaireImmersion } from '../../../infrastructure/repositories/dto/immersion.dto'
import { toOffreImmersionQueryModel } from '../../../infrastructure/repositories/mappers/offres-immersion.mappers'
import { RechercheOffreInvalide } from '../../../building-blocks/types/domain-error'
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
    const distanceAvecDefault = query.distance
      ? query.distance.toString()
      : Offre.Recherche.DISTANCE_PAR_DEFAUT.toString()
    const params = new URLSearchParams()

    const appellationCodeListe = await this.romeToAppellationCode(query.rome)

    params.append('distanceKm', distanceAvecDefault)
    params.append('longitude', query.lon.toString())
    params.append('latitude', query.lat.toString())
    appellationCodeListe.forEach(appellationCode => {
      params.append('appellationCodes[]', appellationCode)
    })
    params.append('sortedBy', 'date')
    params.append('voluntaryToImmersion', 'true')

    try {
      const response = await this.immersionClient.get<
        PartenaireImmersion.DtoV2[]
      >('v2/search', params)

      // todo dans le mapper remplacer l'ID 'siret-rome' par 'siret/appellationCode'
      // !!!! faire gaff car un metier peut avoir plusieurs appellationCode => voir lequelle remonter
      return success(response.data.map(toOffreImmersionQueryModel))
    } catch (e) {
      if (e.response?.status === 400) {
        const message = e.response.data.errors
          .map((error: { message: string }) => error.message)
          .join(' - ')
        return failure(new RechercheOffreInvalide(message))
      }
      throw e
    }
  }

  async romeToAppellationCode(codeRome: string): Promise<string[]> {
    const metiers: Array<{ appellation_code: string }> =
      await this.sequelize.query(
        `SELECT code, libelle, libelle_sanitized AS "score", appellation_code
       FROM "referentiel_metier_rome"
       WHERE code = ?
       ORDER BY "score" DESC LIMIT 20;`,
        {
          replacements: [codeRome],
          type: QueryTypes.SELECT
        }
      )

    const appellationCodeListe: string[] = metiers.map(m => m.appellation_code)

    return appellationCodeListe
  }
}
