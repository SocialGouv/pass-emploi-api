import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  Result,
  emptySuccess,
  failure
} from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../../../domain/planificateur'
import { DateService } from '../../../utils/date-service'
import { ConseillerSqlModel } from '../../../infrastructure/sequelize/models/conseiller.sql-model'
import { AgenceSqlModel } from '../../../infrastructure/sequelize/models/agence.sql-model'
import { DroitsInsuffisants } from '../../../building-blocks/types/domain-error'
import { ID_AGENCE_MILO_JDD } from '../../queries/get-agences.query.handler.db'

export interface RefreshJddCommand {
  idConseiller: string
  menage: boolean
}

@Injectable()
export class RefreshJddCommandHandler extends CommandHandler<
  RefreshJddCommand,
  void
> {
  constructor(
    private dateService: DateService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super('RefreshJddCommandHandler')
  }

  async authorize(
    command: RefreshJddCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const conseiller = await ConseillerSqlModel.findByPk(command.idConseiller, {
      include: [AgenceSqlModel]
    })
    if (
      (utilisateur.type !== Authentification.Type.SUPPORT &&
        utilisateur.id !== command.idConseiller) ||
      conseiller?.agence?.id !== ID_AGENCE_MILO_JDD
    ) {
      return failure(new DroitsInsuffisants())
    }
    return emptySuccess()
  }

  async handle(command: RefreshJddCommand): Promise<Result> {
    const job: Planificateur.Job<Planificateur.JobGenererJDD> = {
      dateExecution: this.dateService.nowJs(),
      type: Planificateur.JobType.GENERER_JDD,
      contenu: {
        idConseiller: command.idConseiller,
        menage: command.menage
      }
    }
    await this.planificateurRepository.creerJob(job)
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
