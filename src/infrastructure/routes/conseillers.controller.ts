import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CreateRendezVousCommandHandler } from 'src/application/commands/create-rendez-vous.command.handler'
import { GetDetailConseillerQueryHandler } from 'src/application/queries/get-detail-conseiller.query.handler'
import { GetJeunesByConseillerQueryHandler } from 'src/application/queries/get-jeunes-by-conseiller.query.handler'
import { DetailConseillerQueryModel } from 'src/application/queries/query-models/conseillers.query-models'
import { Authentification } from 'src/domain/authentification'
import { CreateActionCommandHandler } from '../../application/commands/create-action.command.handler'
import { CreateJeuneCommandHandler } from '../../application/commands/create-jeune.command.handler'
import { SendNotificationNouveauMessageCommandHandler } from '../../application/commands/send-notification-nouveau-message.command.handler'
import { GetDossierMiloJeuneQueryHandler } from '../../application/queries/get-dossier-milo-jeune.query.handler'
import { GetAllRendezVousConseillerQueryHandler } from '../../application/queries/get-rendez-vous-conseiller.query.handler'
import { GetResumeActionsDesJeunesDuConseillerQueryHandler } from '../../application/queries/get-resume-actions-des-jeunes-du-conseiller.query.handler'
import {
  DetailJeuneQueryModel,
  ResumeActionsDuJeuneQueryModel
} from '../../application/queries/query-models/jeunes.query-models'
import { DossierJeuneMiloQueryModel } from '../../application/queries/query-models/milo.query-model'
import { RendezVousConseillerQueryModel } from '../../application/queries/query-models/rendez-vous.query-models'
import {
  JeuneNonLieAuConseillerError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  isFailure,
  isSuccess,
  Result
} from '../../building-blocks/types/result'
import { Action } from '../../domain/action'
import { Utilisateur } from '../decorators/authenticated.decorator'
import {
  CreateActionPayload,
  CreateJeunePayload
} from './validation/conseillers.inputs'
import { CreateRendezVousPayload } from './validation/rendez-vous.inputs'

@Controller('conseillers')
@ApiOAuth2([])
@ApiTags('Conseillers')
export class ConseillersController {
  constructor(
    private readonly getDetailConseillerQueryHandler: GetDetailConseillerQueryHandler,
    private readonly getJeunesByConseillerQueryHandler: GetJeunesByConseillerQueryHandler,
    private readonly getResumeActionsDesJeunesDuConseillerQueryHandler: GetResumeActionsDesJeunesDuConseillerQueryHandler,
    private readonly createActionCommandHandler: CreateActionCommandHandler,
    private readonly createJeuneCommandHandler: CreateJeuneCommandHandler,
    private readonly sendNotificationNouveauMessage: SendNotificationNouveauMessageCommandHandler,
    private readonly getAllRendezVousConseillerQueryHandler: GetAllRendezVousConseillerQueryHandler,
    private createRendezVousCommandHandler: CreateRendezVousCommandHandler,
    private getDossierMiloJeuneQueryHandler: GetDossierMiloJeuneQueryHandler
  ) {}

  @Get(':idConseiller')
  @ApiResponse({
    type: DetailConseillerQueryModel
  })
  async getDetailConseiller(
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DetailConseillerQueryModel> {
    const queryModel = await this.getDetailConseillerQueryHandler.execute(
      {
        idConseiller
      },
      utilisateur
    )
    if (queryModel) {
      return queryModel
    }

    throw new HttpException(
      `Conseiller ${idConseiller} not found`,
      HttpStatus.NOT_FOUND
    )
  }

  @Get(':idConseiller/jeunes')
  @ApiResponse({
    type: DetailJeuneQueryModel,
    isArray: true
  })
  async getJeunes(
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DetailJeuneQueryModel[]> {
    return this.getJeunesByConseillerQueryHandler.execute(
      { idConseiller },
      utilisateur
    )
  }

  @Post(':idConseiller/jeune')
  @ApiResponse({
    type: DetailJeuneQueryModel,
    isArray: true
  })
  async createJeune(
    @Param('idConseiller') idConseiller: string,
    @Body() createJeunePayload: CreateJeunePayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DetailJeuneQueryModel> {
    const jeune = await this.createJeuneCommandHandler.execute(
      {
        idConseiller,
        ...createJeunePayload
      },
      utilisateur
    )
    return {
      id: jeune.id,
      firstName: jeune.firstName,
      lastName: jeune.lastName,
      creationDate: jeune.creationDate.toString()
    }
  }

  @Post(':idConseiller/jeunes/:idJeune/action')
  async createAction(
    @Param('idConseiller') idConseiller: string,
    @Param('idJeune') idJeune: string,
    @Body() createActionPayload: CreateActionPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<{ id: Action.Id }> {
    const result = await this.createActionCommandHandler.execute(
      {
        contenu: createActionPayload.content,
        idJeune,
        idCreateur: idConseiller,
        typeCreateur: Action.TypeCreateur.CONSEILLER,
        commentaire: createActionPayload.comment
      },
      utilisateur
    )

    if (isFailure(result) && result.error.code === NonTrouveError.CODE) {
      throw new NotFoundException(result.error)
    }

    if (isSuccess(result)) {
      return {
        id: result.data
      }
    }
    throw new RuntimeException()
  }

  @Get(':idConseiller/actions')
  async getActions(
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<ResumeActionsDuJeuneQueryModel[]> {
    return this.getResumeActionsDesJeunesDuConseillerQueryHandler.execute(
      {
        idConseiller
      },
      utilisateur
    )
  }

  @Get(':idConseiller/rendezvous')
  @ApiResponse({
    type: RendezVousConseillerQueryModel
  })
  async getRendezVous(
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<RendezVousConseillerQueryModel> {
    return this.getAllRendezVousConseillerQueryHandler.execute(
      { idConseiller },
      utilisateur
    )
  }

  @Post(':idConseiller/jeunes/:idJeune/notify-message')
  async postNotification(
    @Param('idConseiller') idConseiller: string,
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.sendNotificationNouveauMessage.execute(
      {
        idConseiller,
        idJeune
      },
      utilisateur
    )
    if (isFailure(result)) {
      if (
        result.error.code === NonTrouveError.CODE ||
        result.error.code === JeuneNonLieAuConseillerError.CODE
      ) {
        throw new NotFoundException(result.error)
      } else {
        throw new RuntimeException()
      }
    }
  }

  @Post(':idConseiller/rendezvous')
  async createRendezVous(
    @Param('idConseiller') idConseiller: string,
    @Body() createRendezVousPayload: CreateRendezVousPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<{ id: string }> {
    const result: Result<string> =
      await this.createRendezVousCommandHandler.execute(
        {
          idJeune: createRendezVousPayload.jeuneId,
          commentaire: createRendezVousPayload.comment,
          date: createRendezVousPayload.date,
          duree: createRendezVousPayload.duration,
          idConseiller: idConseiller,
          modalite: createRendezVousPayload.modality
        },
        utilisateur
      )

    if (isFailure(result)) {
      switch (result.error.code) {
        case JeuneNonLieAuConseillerError.CODE:
          throw new BadRequestException(result.error)
        case NonTrouveError.CODE:
          throw new NotFoundException(result.error)
      }
    }

    if (isSuccess(result)) {
      return { id: result.data }
    }
    throw new RuntimeException()
  }

  @Get('/milo/dossiers/:idDossier')
  @ApiResponse({
    type: DossierJeuneMiloQueryModel
  })
  async getDossierMilo(
    @Param('idDossier') idDossier: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DossierJeuneMiloQueryModel> {
    const dossier = await this.getDossierMiloJeuneQueryHandler.execute(
      { idDossier },
      utilisateur
    )

    if (!dossier) {
      throw new NotFoundException(`Le dossier ${idDossier} n'existe pas`)
    }

    return dossier
  }
}
