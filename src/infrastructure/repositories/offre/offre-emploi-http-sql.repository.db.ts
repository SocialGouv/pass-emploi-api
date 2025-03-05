import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Offre } from '../../../domain/offre/offre'
import { FavoriOffreEmploiSqlModel } from '../../sequelize/models/favori-offre-emploi.sql-model'
import { toFavoriOffreEmploi } from '../mappers/offres-emploi.mappers'
import Favori = Offre.Favori

@Injectable()
export class OffresEmploiHttpSqlRepository
  implements Offre.Favori.Emploi.Repository
{
  async get(
    idJeune: string,
    idOffreEmploi: string
  ): Promise<Favori<Offre.Favori.Emploi> | undefined> {
    const sqlModel = await FavoriOffreEmploiSqlModel.findOne({
      where: {
        idJeune: idJeune,
        idOffre: idOffreEmploi
      }
    })
    if (!sqlModel) {
      return undefined
    }

    const favori: Favori<Offre.Favori.Emploi> = {
      idBeneficiaire: idJeune,
      offre: toFavoriOffreEmploi(sqlModel),
      dateCreation: DateTime.fromJSDate(sqlModel.dateCreation)
    }
    if (sqlModel.dateCandidature) {
      favori.dateCandidature = DateTime.fromJSDate(sqlModel.dateCandidature)
    }
    return favori
  }

  async save(favori: Offre.Favori<Offre.Favori.Emploi>): Promise<void> {
    await FavoriOffreEmploiSqlModel.upsert(toFavoriOffreEmploiSqlModel(favori))
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

function toFavoriOffreEmploiSqlModel(
  favori: Favori<Offre.Favori.Emploi>
): Partial<FavoriOffreEmploiSqlModel> {
  const { idBeneficiaire, offre, dateCreation, dateCandidature } = favori

  return {
    idJeune: idBeneficiaire,
    idOffre: offre.id,
    titre: offre.titre,
    typeContrat: offre.typeContrat,
    nomEntreprise: offre.nomEntreprise,
    duree: offre.duree,
    nomLocalisation: offre.localisation?.nom || null,
    codePostalLocalisation: offre.localisation?.codePostal || null,
    communeLocalisation: offre.localisation?.commune || null,
    isAlternance: offre.alternance,
    dateCreation: dateCreation.toJSDate(),
    dateCandidature: dateCandidature?.toJSDate() ?? null,
    origineNom: offre.origine?.nom || null,
    origineLogoUrl: offre.origine?.logo || null
  }
}
