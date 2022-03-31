import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  CreateRendezVousCommand,
  CreateRendezVousCommandHandler
} from 'src/application/commands/create-rendez-vous.command.handler'
import { CreerSuperviseursCommandHandler } from 'src/application/commands/creer-superviseurs.command.handler'
import { DeleteSuperviseursCommandHandler } from 'src/application/commands/delete-superviseurs.command.handler'
import { GetDetailConseillerQueryHandler } from 'src/application/queries/get-detail-conseiller.query.handler'
import { GetJeuneMiloByDossierQueryHandler } from 'src/application/queries/get-jeune-milo-by-dossier.query.handler'
import { GetJeunesByConseillerQueryHandler } from 'src/application/queries/get-jeunes-by-conseiller.query.handler'
import { DetailConseillerQueryModel } from 'src/application/queries/query-models/conseillers.query-models'
import { Authentification } from 'src/domain/authentification'
import { CreateActionCommandHandler } from '../../application/commands/create-action.command.handler'
import { CreerJeuneMiloCommandHandler } from '../../application/commands/creer-jeune-milo.command.handler'
import { CreerJeunePoleEmploiCommandHandler } from '../../application/commands/creer-jeune-pole-emploi.command.handler'
import { SendNotificationNouveauMessageCommandHandler } from '../../application/commands/send-notification-nouveau-message.command.handler'
import {
  SendNotificationsNouveauxMessagesCommand,
  SendNotificationsNouveauxMessagesCommandHandler
} from '../../application/commands/send-notifications-nouveaux-messages.command.handler'
import { GetConseillerByEmailQueryHandler } from '../../application/queries/get-conseiller-by-email.query.handler'
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
  DossierExisteDejaError,
  DroitsInsuffisants,
  EmailExisteDejaError,
  ErreurHttp,
  JeuneNonLieAuConseillerError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  isFailure,
  isSuccess,
  Result
} from '../../building-blocks/types/result'
import { Action } from '../../domain/action'
import { Core } from '../../domain/core'
import { Utilisateur } from '../decorators/authenticated.decorator'
import {
  CreateActionPayload,
  CreateJeunePoleEmploiPayload,
  CreerJeuneMiloPayload,
  EnvoyerNotificationsPayload,
  GetConseillerQueryParams,
  GetRendezVousConseillerQueryParams,
  SuperviseursPayload
} from './validation/conseillers.inputs'
import { CreateRendezVousPayload } from './validation/rendez-vous.inputs'

@Controller('conseillers')
@ApiOAuth2([])
@ApiTags('Conseillers')
export class ConseillersController {
  constructor(
    private readonly getDetailConseillerQueryHandler: GetDetailConseillerQueryHandler,
    private readonly getConseillerByEmailQueryHandler: GetConseillerByEmailQueryHandler,
    private readonly getJeunesByConseillerQueryHandler: GetJeunesByConseillerQueryHandler,
    private readonly getResumeActionsDesJeunesDuConseillerQueryHandler: GetResumeActionsDesJeunesDuConseillerQueryHandler,
    private readonly createActionCommandHandler: CreateActionCommandHandler,
    private readonly creerJeunePoleEmploiCommandHandler: CreerJeunePoleEmploiCommandHandler,
    private readonly sendNotificationNouveauMessage: SendNotificationNouveauMessageCommandHandler,
    private readonly sendNotificationsNouveauxMessages: SendNotificationsNouveauxMessagesCommandHandler,
    private readonly getAllRendezVousConseillerQueryHandler: GetAllRendezVousConseillerQueryHandler,
    private readonly createRendezVousCommandHandler: CreateRendezVousCommandHandler,
    private readonly getDossierMiloJeuneQueryHandler: GetDossierMiloJeuneQueryHandler,
    private readonly getJeuneMiloByDossierQueryHandler: GetJeuneMiloByDossierQueryHandler,
    private readonly creerJeuneMiloCommandHandler: CreerJeuneMiloCommandHandler,
    private readonly creerSuperviseursCommandHandler: CreerSuperviseursCommandHandler,
    private readonly deleteSuperviseursCommandHandler: DeleteSuperviseursCommandHandler
  ) {}

  @Get()
  @ApiResponse({
    type: DetailConseillerQueryModel
  })
  async getDetailConseillerByEmail(
    @Query() getConseillerQuery: GetConseillerQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DetailConseillerQueryModel> {
    let result: Result<DetailConseillerQueryModel>
    try {
      result = await this.getConseillerByEmailQueryHandler.execute(
        {
          emailConseiller: getConseillerQuery.email,
          structureUtilisateur: utilisateur.structure
        },
        utilisateur
      )
    } catch (e) {
      if (e instanceof DroitsInsuffisants) {
        throw new ForbiddenException(e)
      }
      throw e
    }

    if (isSuccess(result)) {
      return result.data
    }

    if (isFailure(result)) {
      if (result.error instanceof NonTrouveError) {
        throw new NotFoundException(result.error)
      }
    }

    throw new RuntimeException()
  }

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
    let result
    try {
      result = await this.getJeunesByConseillerQueryHandler.execute(
        { idConseiller },
        utilisateur
      )
    } catch (erreur) {
      if (erreur instanceof DroitsInsuffisants) {
        throw new ForbiddenException(erreur)
      }
      throw erreur
    }
    if (isSuccess(result)) return result.data
    if (isFailure(result)) {
      const error = result.error
      if (error instanceof NonTrouveError) {
        throw new NotFoundException(error)
      }
      if (error instanceof DroitsInsuffisants) {
        throw new ForbiddenException(error)
      }
    }
    throw new RuntimeException()
  }

  @Post('pole-emploi/jeunes')
  @ApiResponse({
    type: DetailJeuneQueryModel,
    isArray: true
  })
  async createJeunePoleEmploi(
    @Body() createJeunePayload: CreateJeunePoleEmploiPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DetailJeuneQueryModel> {
    const result = await this.creerJeunePoleEmploiCommandHandler.execute(
      {
        ...createJeunePayload
      },
      utilisateur
    )
    if (isFailure(result) && result.error.code === EmailExisteDejaError.CODE) {
      throw new BadRequestException(result.error)
    }

    if (isSuccess(result)) {
      const jeune = result.data
      return {
        id: jeune.id,
        firstName: jeune.firstName,
        lastName: jeune.lastName,
        email: jeune.email,
        creationDate: jeune.creationDate.toString(),
        isActivated: false
      }
    }

    throw new RuntimeException()
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
    @Query() getRendezVousConseillerQuery: GetRendezVousConseillerQueryParams,
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<RendezVousConseillerQueryModel> {
    return this.getAllRendezVousConseillerQueryHandler.execute(
      {
        idConseiller,
        presenceConseiller: getRendezVousConseillerQuery.presenceConseiller
      },
      utilisateur
    )
  }
  // Deprecated (Web)
  @Post(':idConseiller/jeunes/:idJeune/notify-message')
  async postNotificationDeprecated(
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

  @Post(':idConseiller/jeunes/notify-messages')
  async postNotifications(
    @Param('idConseiller') idConseiller: string,
    @Body() envoyerNotificationsPayload: EnvoyerNotificationsPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: SendNotificationsNouveauxMessagesCommand = {
      idsJeunes: envoyerNotificationsPayload.idsJeunes,
      idConseiller
    }
    const result = await this.sendNotificationsNouveauxMessages.execute(
      command,
      utilisateur
    )

    if (isFailure(result)) {
      throw new RuntimeException()
    }
  }

  @Post(':idConseiller/rendezvous')
  async createRendezVous(
    @Param('idConseiller') idConseiller: string,
    @Body() createRendezVousPayload: CreateRendezVousPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<Core.Id> {
    const command: CreateRendezVousCommand = {
      idJeune: createRendezVousPayload.jeuneId,
      commentaire: createRendezVousPayload.comment,
      date: createRendezVousPayload.date,
      duree: createRendezVousPayload.duration,
      idConseiller: idConseiller,
      modalite: createRendezVousPayload.modality,
      type: createRendezVousPayload.type,
      precision: createRendezVousPayload.precision,
      adresse: createRendezVousPayload.adresse,
      organisme: createRendezVousPayload.organisme,
      presenceConseiller: createRendezVousPayload.presenceConseiller,
      invitation: createRendezVousPayload.invitation
    }

    const result: Result<string> =
      await this.createRendezVousCommandHandler.execute(command, utilisateur)

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
    const result = await this.getDossierMiloJeuneQueryHandler.execute(
      { idDossier },
      utilisateur
    )

    if (isFailure(result)) {
      if (result.error.code === ErreurHttp.CODE) {
        throw new HttpException(
          result.error.message,
          (result.error as ErreurHttp).statusCode
        )
      }
      throw new RuntimeException(result.error.message)
    }

    return result.data
  }

  @Get('milo/jeunes/:idDossier')
  @ApiResponse({
    type: DetailJeuneQueryModel
  })
  async getJeuneMiloByDossier(
    @Param('idDossier') idDossier: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DetailJeuneQueryModel> {
    let result: Result<DetailJeuneQueryModel>
    try {
      result = await this.getJeuneMiloByDossierQueryHandler.execute(
        { idDossier },
        utilisateur
      )
    } catch (e) {
      if (e instanceof DroitsInsuffisants) {
        throw new ForbiddenException(e)
      }
      throw e
    }

    if (isFailure(result)) {
      if (result.error.code === NonTrouveError.CODE) {
        throw new NotFoundException(result.error)
      }
      if (result.error.code === ErreurHttp.CODE) {
        throw new HttpException(
          result.error.message,
          (result.error as ErreurHttp).statusCode
        )
      }
      throw new RuntimeException(result.error.message)
    }

    return result.data
  }

  @Post('milo/jeunes')
  async postJeuneMilo(
    @Body() creerJeuneMiloPayload: CreerJeuneMiloPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<Core.Id> {
    const result = await this.creerJeuneMiloCommandHandler.execute(
      creerJeuneMiloPayload,
      utilisateur
    )

    if (isFailure(result)) {
      if (result.error.code === ErreurHttp.CODE) {
        throw new HttpException(
          result.error.message,
          (result.error as ErreurHttp).statusCode
        )
      }
      if (
        result.error.code === EmailExisteDejaError.CODE ||
        result.error.code === DossierExisteDejaError.CODE
      ) {
        throw new HttpException(result.error.message, 409)
      }
      throw new RuntimeException(result.error.message)
    }

    return result.data
  }

  @Post('superviseurs')
  async postSuperviseurs(
    @Body() superviseursPayload: SuperviseursPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.creerSuperviseursCommandHandler.execute(
      { superviseurs: superviseursPayload.superviseurs },
      utilisateur
    )

    if (isFailure(result)) {
      throw new RuntimeException(result.error.message)
    }
  }

  @Delete('superviseurs')
  @HttpCode(204)
  async deleteSuperviseurs(
    @Body() superviseursPayload: SuperviseursPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.deleteSuperviseursCommandHandler.execute(
      { superviseurs: superviseursPayload.superviseurs },
      utilisateur
    )

    if (isFailure(result)) {
      if (result.error.code === ErreurHttp.CODE) {
        throw new HttpException(
          result.error.message,
          (result.error as ErreurHttp).statusCode
        )
      }
      throw new RuntimeException(result.error.message)
    }
  }
}
