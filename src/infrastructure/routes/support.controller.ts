import {
  Body,
  Controller,
  ForbiddenException,
  Inject,
  Post
} from '@nestjs/common'
import { ApiOAuth2, ApiProperty, ApiTags } from '@nestjs/swagger'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../../domain/planificateur'
import { DateService } from '../../utils/date-service'
import { IsBoolean, IsString } from 'class-validator'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { Authentification } from '../../domain/authentification'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { ID_AGENCE_MILO_JDD } from '../../application/queries/get-agences.query.handler.db'
import { AgenceSqlModel } from '../sequelize/models/agence.sql-model'

export class RefreshJDDPayload {
  @ApiProperty()
  @IsString()
  idConseiller: string

  @ApiProperty()
  @IsBoolean()
  menage: boolean
}

@ApiOAuth2([])
@Controller()
@ApiTags('Support')
export class SupportController {
  constructor(
    private dateService: DateService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {}

  @Post('jdd')
  async refresh(
    @Body() payload: RefreshJDDPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const conseiller = await ConseillerSqlModel.findByPk(payload.idConseiller, {
      include: [AgenceSqlModel]
    })
    if (
      (utilisateur.type !== Authentification.Type.SUPPORT &&
        utilisateur.id !== payload.idConseiller) ||
      conseiller?.agence?.id !== ID_AGENCE_MILO_JDD
    ) {
      throw new ForbiddenException('Non')
    }

    const job: Planificateur.Job<Planificateur.JobGenererJDD> = {
      dateExecution: this.dateService.nowJs(),
      type: Planificateur.JobType.GENERER_JDD,
      contenu: {
        idConseiller: payload.idConseiller,
        menage: payload.menage
      }
    }
    await this.planificateurRepository.creerJob(job)
  }
}
