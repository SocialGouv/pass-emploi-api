import { Injectable } from '@nestjs/common'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { Evenement } from '../../domain/evenement'
import { EvenementEngagementHebdoSqlModel } from '../sequelize/models/evenement-engagement-hebdo.sql-model'
import { RateLimiterService } from '../../utils/rate-limiter.service'

@Injectable()
export class EvenementSqlRepository implements Evenement.Repository {
  constructor(private rateLimiterService: RateLimiterService) {}

  async save(evenement: Evenement): Promise<Result> {
    const dto = {
      code: evenement.code ?? null,
      categorie: evenement.categorie ?? null,
      action: evenement.action ?? null,
      nom: evenement.nom ?? null,
      idUtilisateur: evenement.utilisateur.id,
      typeUtilisateur: evenement.utilisateur.type,
      structure: evenement.utilisateur.structure,
      dateEvenement: evenement.date
    }
    await this.rateLimiterService.evenementsEngagementRateLimiter.attendreLaProchaineDisponibilite()
    await EvenementEngagementHebdoSqlModel.create(dto)
    return emptySuccess()
  }
}
