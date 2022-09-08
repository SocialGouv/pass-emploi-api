import { Injectable } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { Evenement } from '../../domain/evenement'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { EvenementEngagementSqlModel } from '../sequelize/models/evenement-engagement.sql-model'

@Injectable()
export class EvenementHttpSqlRepository implements Evenement.Repository {
  async save(
    utilisateur: Authentification.Utilisateur,
    evenement: Evenement
  ): Promise<Result> {
    await EvenementEngagementSqlModel.create({
      code: evenement.code ?? null,
      categorie: evenement.categorie ?? null,
      action: evenement.action ?? null,
      nom: evenement.nom ?? null,
      idUtilisateur: utilisateur.id,
      typeUtilisateur: utilisateur.type,
      structure: utilisateur.structure,
      dateEvenement: evenement.date
    })
    return emptySuccess()
  }
}
