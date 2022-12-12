import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { Command } from '../../../building-blocks/types/command'
import {
  emptySuccess,
  Result,
  success
} from '../../../building-blocks/types/result'
import { Inject, Injectable } from '@nestjs/common'
import { Op, Sequelize } from 'sequelize'
import { SequelizeInjectionToken } from '../../../infrastructure/sequelize/providers'
import { DateService } from '../../../utils/date-service'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { CodeTypeRendezVous } from '../../../domain/rendez-vous/rendez-vous'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'

@Injectable()
export class HandleJobAgenceAnimationCollectiveCommandHandler extends CommandHandler<
  Command,
  Stats
> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private dateService: DateService,
    @Inject(SuiviJobServiceToken)
    notificationSupportService: SuiviJob.Service
  ) {
    super(
      'HandleJobAgenceAnimationCollectiveCommandHandler',
      notificationSupportService
    )
  }

  async handle(): Promise<Result<Stats>> {
    const debut = this.dateService.now()
    const nombreTotalAnimationCollectives = await RendezVousSqlModel.count({
      where: {
        type: {
          [Op.in]: [
            CodeTypeRendezVous.INFORMATION_COLLECTIVE,
            CodeTypeRendezVous.ATELIER
          ]
        }
      }
    })

    const nombreAnimationCollectiveSansAgenceAvant =
      await RendezVousSqlModel.count({
        where: {
          idAgence: {
            [Op.eq]: null
          },
          type: {
            [Op.in]: [
              CodeTypeRendezVous.INFORMATION_COLLECTIVE,
              CodeTypeRendezVous.ATELIER
            ]
          }
        }
      })

    // Requête en deux parties :
    // Subquery :
    // - récupérer les animations collectives qui n'ont pas d'agence
    // - récupérer l'agence du conseiller créateur
    // - si le conseiller n'a pas d'agence, ne pas remonter l'animation collective
    // Update :
    // - mettre à jour l'animation collective avec l'agence récupérée
    await this.sequelize.query(`
        with rendez_vous_agence as (select rendez_vous_jointure.id, conseiller.id_agence
                                    from rendez_vous as rendez_vous_jointure
                                             left join conseiller on rendez_vous_jointure.createur ->> 'id' = conseiller.id
                                    where (type = 'ATELIER' OR type = 'INFORMATION_COLLECTIVE')
                                      AND rendez_vous_jointure.id_agence is null
                                      AND conseiller.id_agence is not null)
        update rendez_vous
        set id_agence = rendez_vous_agence.id_agence
        from rendez_vous_agence
        where rendez_vous.id = rendez_vous_agence.id;`)

    const nombreAnimationCollectiveSansAgenceApres =
      await RendezVousSqlModel.count({
        where: {
          idAgence: {
            [Op.eq]: null
          },
          type: {
            [Op.in]: [
              CodeTypeRendezVous.INFORMATION_COLLECTIVE,
              CodeTypeRendezVous.ATELIER
            ]
          }
        }
      })

    return success({
      tempsDExecution: debut.diffNow().milliseconds * -1,
      nombreTotalAnimationCollectives,
      nombreAnimationCollectiveSansAgenceAvant,
      nombreAnimationCollectiveSansAgenceApres
    })
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}

export interface Stats {
  tempsDExecution: number
  nombreAnimationCollectiveSansAgenceAvant: number
  nombreAnimationCollectiveSansAgenceApres: number
  nombreTotalAnimationCollectives: number
}
