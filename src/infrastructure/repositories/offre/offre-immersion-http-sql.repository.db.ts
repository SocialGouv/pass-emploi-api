import { Injectable } from '@nestjs/common'
import { FavoriOffreImmersionSqlModel } from '../../sequelize/models/favori-offre-immersion.sql-model'
import { fromSqlToFavorisOffreImmersion } from '../mappers/offres-immersion.mappers'
import { Offre } from '../../../domain/offre/offre'

@Injectable()
export class FavorisOffresImmersionSqlRepository
  implements Offre.Favori.Immersion.Repository
{
  async get(
    idJeune: string,
    idOffreImmersion: string
  ): Promise<Offre.Favori.Immersion | undefined> {
    const result = await FavoriOffreImmersionSqlModel.findOne({
      where: {
        idJeune: idJeune,
        idOffre: idOffreImmersion
      }
    })
    if (!result) {
      return undefined
    }
    return fromSqlToFavorisOffreImmersion(result)
  }

  async save(
    idJeune: string,
    offreImmersion: Offre.Favori.Immersion
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

  async delete(idJeune: string, idOffreImmersion: string): Promise<void> {
    await FavoriOffreImmersionSqlModel.destroy({
      where: {
        idOffre: idOffreImmersion,
        idJeune
      }
    })
  }
}
