import { Injectable } from '@nestjs/common'
import { FavoriOffreEmploiSqlModel } from '../../sequelize/models/favori-offre-emploi.sql-model'
import {
  toFavoriOffreEmploiSqlModel,
  toOffreEmploi
} from '../mappers/offres-emploi.mappers'
import { Offre } from '../../../domain/offre/offre'
import { DateService } from '../../../utils/date-service'

@Injectable()
export class OffresEmploiHttpSqlRepository
  implements Offre.Favori.Emploi.Repository
{
  constructor(private readonly dateService: DateService) {}

  async get(
    idJeune: string,
    idOffreEmploi: string
  ): Promise<Offre.Favori.Emploi | undefined> {
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

  async save(idJeune: string, offreEmploi: Offre.Favori.Emploi): Promise<void> {
    const maintenantJs = this.dateService.nowJs()
    await FavoriOffreEmploiSqlModel.create(
      toFavoriOffreEmploiSqlModel(idJeune, offreEmploi, maintenantJs)
    )
  }

  async delete(idJeune: string, idOffreEmploi: string): Promise<void> {
    await FavoriOffreEmploiSqlModel.destroy({
      where: {
        idOffre: idOffreEmploi,
        idJeune
      }
    })
  }
}
