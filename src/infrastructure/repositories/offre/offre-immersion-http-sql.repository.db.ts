import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Offre } from '../../../domain/offre/offre'
import { FavoriOffreImmersionSqlModel } from '../../sequelize/models/favori-offre-immersion.sql-model'
import { fromSqlToFavorisOffreImmersion } from '../mappers/offres-immersion.mappers'

@Injectable()
export class FavorisOffresImmersionSqlRepository
  implements Offre.Favori.Immersion.Repository
{
  async get(
    idJeune: string,
    idOffreImmersion: string
  ): Promise<Offre.Favori<Offre.Favori.Immersion> | undefined> {
    const result = await FavoriOffreImmersionSqlModel.findOne({
      where: {
        idJeune: idJeune,
        idOffre: idOffreImmersion
      }
    })
    if (!result) {
      return undefined
    }

    const favori: Offre.Favori<Offre.Favori.Immersion> = {
      idBeneficiaire: idJeune,
      dateCreation: DateTime.fromJSDate(result.dateCreation),
      offre: fromSqlToFavorisOffreImmersion(result)
    }
    if (result.dateCandidature) {
      favori.dateCandidature = DateTime.fromJSDate(result.dateCandidature)
    }

    return favori
  }

  async save(favori: Offre.Favori<Offre.Favori.Immersion>): Promise<void> {
    const { idBeneficiaire, offre, dateCreation, dateCandidature } = favori

    await FavoriOffreImmersionSqlModel.upsert({
      idOffre: offre.id,
      idJeune: idBeneficiaire,
      metier: offre.metier,
      nomEtablissement: offre.nomEtablissement,
      secteurActivite: offre.secteurActivite,
      ville: offre.ville,
      dateCreation: dateCreation.toJSDate(),
      dateCandidature: dateCandidature?.toJSDate() ?? null
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
