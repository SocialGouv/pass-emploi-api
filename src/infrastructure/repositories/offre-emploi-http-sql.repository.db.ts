import { Injectable } from '@nestjs/common'
import { OffreEmploi, OffresEmploi } from '../../domain/offre-emploi'
import { FavoriOffreEmploiSqlModel } from '../sequelize/models/favori-offre-emploi.sql-model'
import {
  toFavoriOffreEmploiSqlModel,
  toOffreEmploi
} from './mappers/offres-emploi.mappers'

@Injectable()
export class OffresEmploiHttpSqlRepository implements OffresEmploi.Repository {
  async getFavori(
    idJeune: string,
    idOffreEmploi: string
  ): Promise<OffreEmploi | undefined> {
    const result = await FavoriOffreEmploiSqlModel.findOne({
      where: {
        idJeune: idJeune,
        idOffre: idOffreEmploi
      }
    })
    if (!result) {
      return undefined
    }
    return toOffreEmploi(result)
  }

  async saveAsFavori(idJeune: string, offreEmploi: OffreEmploi): Promise<void> {
    await FavoriOffreEmploiSqlModel.create(
      toFavoriOffreEmploiSqlModel(idJeune, offreEmploi)
    )
  }

  async deleteFavori(idJeune: string, idOffreEmploi: string): Promise<void> {
    await FavoriOffreEmploiSqlModel.destroy({
      where: {
        idOffre: idOffreEmploi,
        idJeune
      }
    })
  }
}
