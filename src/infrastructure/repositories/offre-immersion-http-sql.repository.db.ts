import { Injectable } from '@nestjs/common'
import {
  DetailOffreImmersionQueryModel,
  OffreImmersionQueryModel
} from 'src/application/queries/query-models/offres-immersion.query-model'
import {
  RechercheDetailOffreInvalide,
  RechercheDetailOffreNonTrouve,
  RechercheOffreInvalide
} from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { OffreImmersion, OffresImmersion } from '../../domain/offre-immersion'
import { ImmersionClient } from '../clients/immersion-client'
import { FavoriOffreImmersionSqlModel } from '../sequelize/models/favori-offre-immersion.sql-model'
import {
  fromSqlToOffreImmersion,
  toDetailOffreImmersionQueryModel,
  toOffreImmersionQueryModel
} from './mappers/offres-immersion.mappers'
import { URLSearchParams } from 'url'
import { PartenaireImmersion } from './dto/immersion.dto'

@Injectable()
export class OffresImmersionHttpSqlRepository
  implements OffresImmersion.Repository
{
  constructor(private immersionClient: ImmersionClient) {}

  async getFavori(
    idJeune: string,
    idOffreImmersion: string
  ): Promise<OffreImmersion | undefined> {
    const result = await FavoriOffreImmersionSqlModel.findOne({
      where: {
        idJeune: idJeune,
        idOffre: idOffreImmersion
      }
    })
    if (!result) {
      return undefined
    }
    return fromSqlToOffreImmersion(result)
  }

  async saveAsFavori(
    idJeune: string,
    offreImmersion: OffreImmersion
  ): Promise<void> {
    await FavoriOffreImmersionSqlModel.create({
      idOffre: offreImmersion.id,
      idJeune,
      metier: offreImmersion.metier,
      nomEtablissement: offreImmersion.nomEtablissement,
      secteurActivite: offreImmersion.secteurActivite,
      ville: offreImmersion.ville
    })
  }

  async findAll(
    criteres: OffresImmersion.Criteres
  ): Promise<Result<OffreImmersionQueryModel[]>> {
    const params = new URLSearchParams()
    params.append('rome', criteres.rome)
    params.append('longitude', criteres.lon.toString())
    params.append('latitude', criteres.lat.toString())
    params.append('distance_km', criteres.distance.toString())
    params.append('sortedBy', 'date')

    try {
      const response = await this.immersionClient.get<
        PartenaireImmersion.DtoV1[]
      >('v1/immersion-offers', params)

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

  async get(
    idOffreImmersion: string
  ): Promise<Result<DetailOffreImmersionQueryModel>> {
    try {
      const response = await this.immersionClient.get<PartenaireImmersion.Dto>(
        `/get-immersion-by-id/${idOffreImmersion}`
      )
      return success(toDetailOffreImmersionQueryModel(response.data))
    } catch (e) {
      if (e.response?.status === 404) {
        const message = `Offre d'immersion ${idOffreImmersion} not found`
        return failure(new RechercheDetailOffreNonTrouve(message))
      }
      if (e.response?.status === 400) {
        return failure(
          new RechercheDetailOffreInvalide(e.response.data.errors.message)
        )
      }
      throw e
    }
  }

  async deleteFavori(idJeune: string, idOffreImmersion: string): Promise<void> {
    await FavoriOffreImmersionSqlModel.destroy({
      where: {
        idOffre: idOffreImmersion,
        idJeune
      }
    })
  }
}
