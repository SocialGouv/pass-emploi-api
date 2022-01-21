import { Injectable, Logger } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Evenement } from 'src/domain/evenement'
import { DateService } from 'src/utils/date-service'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { EvenementEngagementSqlModel } from '../sequelize/models/evenement-engagement.sql-model'

@Injectable()
export class EvenementHttpSqlRepository implements Evenement.Repository {
  private logger: Logger

  constructor(private dateService: DateService) {
    this.logger = new Logger('EvenementHttpSqlRepository')
  }

  async enregistrerEvenement(
    utilisateur: Authentification.Utilisateur,
    categorieEvenement: string,
    actionEvenement: string,
    nomEvenement?: string
  ): Promise<Result> {
    const dateEvenement = this.dateService.nowJs()
    await EvenementEngagementSqlModel.create({
      categorie: categorieEvenement ?? null,
      action: actionEvenement ?? null,
      nom: nomEvenement ?? null,
      idUtilisateur: utilisateur.id,
      typeUtilisateur: utilisateur.type,
      dateEvenement: dateEvenement
    })
    this.logger.log({
      categorie: categorieEvenement,
      action: actionEvenement,
      idUtilisateur: utilisateur.id,
      typeUtilisateur: utilisateur.type
    })
    return emptySuccess()
  }
}
