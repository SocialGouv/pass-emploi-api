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
    if (
      utilisateur.type !== Authentification.Type.SUPPORT &&
      utilisateur.id !== payload.idConseiller
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
