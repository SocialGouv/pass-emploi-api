import { Injectable } from '@nestjs/common'
import { OffreImmersion, OffresImmersion } from '../../domain/offre-immersion'
import { FavoriOffreImmersionSqlModel } from '../sequelize/models/favori-offre-immersion.sql-model'
import { fromSqlToOffreImmersion } from './mappers/offres-immersion.mappers'

@Injectable()
export class OffresImmersionHttpSqlRepository
  implements OffresImmersion.Repository
{
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

  async deleteFavori(idJeune: string, idOffreImmersion: string): Promise<void> {
    await FavoriOffreImmersionSqlModel.destroy({
      where: {
        idOffre: idOffreImmersion,
        idJeune
      }
    })
  }
}
