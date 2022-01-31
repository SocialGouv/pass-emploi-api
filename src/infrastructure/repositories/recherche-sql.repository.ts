import { Injectable } from '@nestjs/common'
import { Recherche } from '../../domain/recherche'
import { RechercheSqlModel } from '../sequelize/models/recherche.sql-model'

@Injectable()
export class RechercheSqlRepository implements Recherche.Repository {
  async saveRecherche(idJeune: string, recherche: Recherche): Promise<void> {
    await RechercheSqlModel.create({
      id: recherche.id,
      idJeune: idJeune,
      titre: recherche.titre,
      metier: recherche.metier,
      type: recherche.type,
      localisation: recherche.localisation,
      criteres: recherche.criteres
    })
  }
}
