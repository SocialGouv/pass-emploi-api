import { Injectable } from '@nestjs/common'
import { Evenement } from '../../domain/evenement'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { EvenementEngagementSqlModel } from '../sequelize/models/evenement-engagement.sql-model'

@Injectable()
export class EvenementSqlRepository implements Evenement.Repository {
  async save(evenement: Evenement): Promise<Result> {
    await EvenementEngagementSqlModel.create({
      code: evenement.code ?? null,
      categorie: evenement.categorie ?? null,
      action: evenement.action ?? null,
      nom: evenement.nom ?? null,
      idUtilisateur: evenement.utilisateur.id,
      typeUtilisateur: evenement.utilisateur.type,
      structure: evenement.utilisateur.structure,
      dateEvenement: evenement.date
    })
    return emptySuccess()
  }
}
