import { Inject, Injectable } from '@nestjs/common'
import { Op, Sequelize } from 'sequelize'
import { Job } from '../../../building-blocks/types/job'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { Planificateur, ProcessJobType } from '../../../domain/planificateur'
import { CodeTypeRendezVous } from '../../../domain/rendez-vous/rendez-vous'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { RendezVousSqlModel } from '../../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { SequelizeInjectionToken } from '../../../infrastructure/sequelize/providers'
import { DateService } from '../../../utils/date-service'

@Injectable()
@ProcessJobType(Planificateur.JobType.MAJ_AGENCE_AC)
export class HandleJobAgenceAnimationCollectiveCommandHandler extends JobHandler<Job> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private dateService: DateService,
    @Inject(SuiviJobServiceToken)
    notificationSupportService: SuiviJob.Service
  ) {
    super(Planificateur.JobType.MAJ_AGENCE_AC, notificationSupportService)
  }

  async handle(): Promise<SuiviJob> {
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

    return {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: true,
      dateExecution: debut,
      tempsExecution: DateService.calculerTempsExecution(debut),
      resultat: {
        nombreTotalAnimationCollectives,
        nombreAnimationCollectiveSansAgenceAvant,
        nombreAnimationCollectiveSansAgenceApres
      }
    }
  }
}
