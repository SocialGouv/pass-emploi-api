import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import {
  ApiBody,
  ApiOAuth2,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger'
import {
  CreateRendezVousCommand,
  CreateRendezVousCommandHandler
} from '../../application/commands/create-rendez-vous.command.handler'
import { CreerSuperviseursCommandHandler } from '../../application/commands/creer-superviseurs.command.handler'
import { DeleteSuperviseursCommandHandler } from '../../application/commands/delete-superviseurs.command.handler'
import { RecupererJeunesDuConseillerCommandHandler } from '../../application/commands/recuperer-jeunes-du-conseiller.command.handler'
import { GetDetailConseillerQueryHandler } from '../../application/queries/get-detail-conseiller.query.handler.db'
import { GetJeuneMiloByDossierQueryHandler } from '../../application/queries/get-jeune-milo-by-dossier.query.handler.db'
import { GetJeunesByConseillerQueryHandler } from '../../application/queries/get-jeunes-by-conseiller.query.handler.db'
import { DetailConseillerQueryModel } from '../../application/queries/query-models/conseillers.query-model'
import { Authentification } from '../../domain/authentification'
import {
  CreateActionCommand,
  CreateActionCommandHandler
} from '../../application/commands/create-action.command.handler'
import {
  CreerJeuneMiloCommand,
  CreerJeuneMiloCommandHandler
} from '../../application/commands/creer-jeune-milo.command.handler'
import { CreerJeunePoleEmploiCommandHandler } from '../../application/commands/creer-jeune-pole-emploi.command.handler'
import { ModifierConseillerCommandHandler } from '../../application/commands/modifier-conseiller.command.handler'
import {
  SendNotificationsNouveauxMessagesCommand,
  SendNotificationsNouveauxMessagesCommandHandler
} from '../../application/commands/send-notifications-nouveaux-messages.command.handler'
import { GetConseillerByEmailQueryHandler } from '../../application/queries/get-conseiller-by-email.query.handler.db'
import { GetDossierMiloJeuneQueryHandler } from '../../application/queries/get-dossier-milo-jeune.query.handler'
import { GetAllRendezVousConseillerQueryHandler } from '../../application/queries/get-rendez-vous-conseiller.query.handler.db'
import { GetResumeActionsDesJeunesDuConseillerQueryHandlerDb } from '../../application/queries/get-resume-actions-des-jeunes-du-conseiller.query.handler.db'
import {
  DetailJeuneConseillerQueryModel,
  DetailJeuneQueryModel,
  JeuneQueryModel,
  ResumeActionsDuJeuneQueryModel
} from '../../application/queries/query-models/jeunes.query-model'
import { DossierJeuneMiloQueryModel } from '../../application/queries/query-models/milo.query-model'
import { RendezVousConseillerFutursEtPassesQueryModel } from '../../application/queries/query-models/rendez-vous.query-model'
import {
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
import { Action } from '../../domain/action/action'
import { Core } from '../../domain/core'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'
import { CreateActionPayload } from './validation/actions.inputs'
import {
  CreateJeunePoleEmploiPayload,
  CreerJeuneMiloPayload,
  DetailConseillerPayload,
  EnvoyerNotificationsPayload,
  GetConseillerQueryParams,
  GetIndicateursPourConseillerQueryParams,
  GetRendezVousConseillerQueryParams,
  PutJeuneDuConseillerPayload,
  SuperviseursPayload
} from './validation/conseillers.inputs'
import { CreateRendezVousPayload } from './validation/rendez-vous.inputs'
import { GetMetadonneesFavorisJeuneQueryHandler } from '../../application/queries/get-metadonnees-favoris-jeune.query.handler.db'
import { DateService } from '../../utils/date-service'
import { ModifierJeuneDuConseillerCommandHandler } from '../../application/commands/modifier-jeune-du-conseiller.command.handler'
import { MetadonneesFavorisQueryModel } from '../../application/queries/query-models/favoris.query-model'
import { IndicateursPourConseillerQueryModel } from '../../application/queries/query-models/indicateurs-pour-conseiller.query-model'
import { GetIndicateursPourConseillerQueryHandler } from '../../application/queries/get-indicateurs-pour-conseiller.query.handler.db'

@Controller('conseillers')
@ApiOAuth2([])
@ApiTags('Conseillers')
export class ConseillersController {
  constructor(
    private readonly dateService: DateService,
    private readonly getDetailConseillerQueryHandler: GetDetailConseillerQueryHandler,
    private readonly getConseillerByEmailQueryHandler: GetConseillerByEmailQueryHandler,
    private readonly getJeunesByConseillerQueryHandler: GetJeunesByConseillerQueryHandler,
    private readonly getResumeActionsDesJeunesDuConseillerQueryHandler: GetResumeActionsDesJeunesDuConseillerQueryHandlerDb,
    private readonly createActionCommandHandler: CreateActionCommandHandler,
    private readonly creerJeunePoleEmploiCommandHandler: CreerJeunePoleEmploiCommandHandler,
    private readonly sendNotificationsNouveauxMessages: SendNotificationsNouveauxMessagesCommandHandler,
    private readonly getAllRendezVousConseillerQueryHandler: GetAllRendezVousConseillerQueryHandler,
    private readonly createRendezVousCommandHandler: CreateRendezVousCommandHandler,
    private readonly getDossierMiloJeuneQueryHandler: GetDossierMiloJeuneQueryHandler,
    private readonly getJeuneMiloByDossierQueryHandler: GetJeuneMiloByDossierQueryHandler,
    private readonly creerJeuneMiloCommandHandler: CreerJeuneMiloCommandHandler,
    private readonly creerSuperviseursCommandHandler: CreerSuperviseursCommandHandler,
    private readonly deleteSuperviseursCommandHandler: DeleteSuperviseursCommandHandler,
    private readonly modifierConseillerCommandHandler: ModifierConseillerCommandHandler,
    private readonly recupererJeunesDuConseillerCommandHandler: RecupererJeunesDuConseillerCommandHandler,
    private readonly getMetadonneesFavorisJeuneQueryHandler: GetMetadonneesFavorisJeuneQueryHandler,
    private readonly modifierJeuneDuConseillerCommandHandler: ModifierJeuneDuConseillerCommandHandler,
    private readonly getIndicateursPourConseillerQueryHandler: GetIndicateursPourConseillerQueryHandler
  ) {}

  @ApiOperation({
    summary: 'Récupère un conseiller par email',
    description: 'Autorisé pour un conseiller'
  })
  @Get()
  @ApiResponse({
    type: DetailConseillerQueryModel
  })
  async getDetailConseillerByEmail(
    @Query() getConseillerQuery: GetConseillerQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DetailConseillerQueryModel> {
    const result = await this.getConseillerByEmailQueryHandler.execute(
      {
        emailConseiller: getConseillerQuery.email,
        structureUtilisateur: utilisateur.structure
      },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }

    throw handleFailure(result)
  }

  @ApiOperation({
    summary: 'Récupère un conseiller',
    description: 'Autorisé pour un conseiller'
  })
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

  @ApiOperation({
    summary: "Récupère les jeunes d'un conseiller",
    description: 'Autorisé pour un conseiller'
  })
  @Get(':idConseiller/jeunes')
  @ApiResponse({
    type: DetailJeuneConseillerQueryModel,
    isArray: true
  })
  async getJeunes(
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DetailJeuneConseillerQueryModel[]> {
    const result = await this.getJeunesByConseillerQueryHandler.execute(
      { idConseiller },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }

    throw handleFailure(result)
  }

  @ApiOperation({
    summary: 'Crée un jeune PE',
    description: 'Autorisé pour un conseiller PE'
  })
  @Post('pole-emploi/jeunes')
  @ApiResponse({
    type: JeuneQueryModel
  })
  async createJeunePoleEmploi(
    @Body() createJeunePayload: CreateJeunePoleEmploiPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<JeuneQueryModel> {
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
        lastName: jeune.lastName
      }
    }

    throw new RuntimeException()
  }

  @ApiOperation({
    summary: 'Deprecated (Web) - Récupère les métadonnées du jeune',
    description: 'Autorisé pour un conseiller du jeune',
    deprecated: true
  })
  @Get(':idConseiller/jeunes/:idJeune/metadonnees')
  async getMetadonneesFavorisJeune(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    @Param('idConseiller') idConseiller: string,
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<MetadonneesFavorisQueryModel> {
    const result = await this.getMetadonneesFavorisJeuneQueryHandler.execute(
      { idJeune },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary: 'Crée une action',
    description: 'Autorisé pour un conseiller du jeune'
  })
  @Post(':idConseiller/jeunes/:idJeune/action')
  async createAction(
    @Param('idConseiller') idConseiller: string,
    @Param('idJeune') idJeune: string,
    @Body() createActionPayload: CreateActionPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<{ id: Action.Id }> {
    const command: CreateActionCommand = {
      contenu: createActionPayload.content,
      idJeune,
      idCreateur: idConseiller,
      typeCreateur: Action.TypeCreateur.CONSEILLER,
      commentaire: createActionPayload.comment,
      rappel: createActionPayload.dateEcheance ? true : false,
      dateEcheance:
        createActionPayload.dateEcheance ?? this.buildDateEcheanceV1()
    }

    const result = await this.createActionCommandHandler.execute(
      command,
      utilisateur
    )

    if (isSuccess(result)) {
      return {
        id: result.data
      }
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary: "Récupère les actions d'un conseiller",
    description: 'Autorisé pour un conseiller'
  })
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

  @ApiOperation({
    summary: "Récupère les rendez-vous d'un conseiller",
    description: 'Autorisé pour un conseiller'
  })
  @Get(':idConseiller/rendezvous')
  @ApiResponse({
    type: RendezVousConseillerFutursEtPassesQueryModel
  })
  async getRendezVous(
    @Query() getRendezVousConseillerQuery: GetRendezVousConseillerQueryParams,
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<RendezVousConseillerFutursEtPassesQueryModel> {
    return this.getAllRendezVousConseillerQueryHandler.execute(
      {
        idConseiller,
        presenceConseiller: getRendezVousConseillerQuery.presenceConseiller
      },
      utilisateur
    )
  }

  @ApiOperation({
    summary: "Envoie une notification d'un nouveau message à des jeunes",
    description: 'Autorisé pour un conseiller'
  })
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

  @ApiOperation({
    summary: 'Crée un rendez-vous pour des jeunes',
    description: 'Autorisé pour un conseiller'
  })
  @Post(':idConseiller/rendezvous')
  async createRendezVous(
    @Param('idConseiller') idConseiller: string,
    @Body() createRendezVousPayload: CreateRendezVousPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<Core.Id> {
    const command: CreateRendezVousCommand = {
      idsJeunes: createRendezVousPayload.jeunesIds,
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

  @ApiOperation({
    summary: "Récupère le dossier Milo d'un jeune",
    description: 'Autorisé pour un conseiller du jeune'
  })
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

  @ApiOperation({
    summary: 'Récupère un jeune par son idDossier Milo',
    description: 'Autorisé pour un conseiller du jeune'
  })
  @Get('milo/jeunes/:idDossier')
  @ApiResponse({
    type: DetailJeuneQueryModel
  })
  async getJeuneMiloByDossier(
    @Param('idDossier') idDossier: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<JeuneQueryModel> {
    const result = await this.getJeuneMiloByDossierQueryHandler.execute(
      { idDossier },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary: 'Crée un jeune Milo',
    description: 'Autorisé pour un conseiller Milo'
  })
  @Post('milo/jeunes')
  async postJeuneMilo(
    @Body() creerJeuneMiloPayload: CreerJeuneMiloPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<Core.Id> {
    const command: CreerJeuneMiloCommand = {
      idConseiller: creerJeuneMiloPayload.idConseiller,
      email: creerJeuneMiloPayload.email,
      nom: creerJeuneMiloPayload.nom,
      prenom: creerJeuneMiloPayload.prenom,
      idPartenaire: creerJeuneMiloPayload.idDossier
    }
    const result = await this.creerJeuneMiloCommandHandler.execute(
      command,
      utilisateur
    )
    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary: 'Ajoute des droits de supervision à des conseillers',
    description: 'Autorisé pour un utilisateur support'
  })
  @Post('superviseurs')
  async postSuperviseurs(
    @Body() superviseursPayload: SuperviseursPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.creerSuperviseursCommandHandler.execute(
      { superviseurs: superviseursPayload.superviseurs },
      utilisateur
    )

    handleFailure(result)
  }

  @ApiOperation({
    summary: 'Supprime des droits de supervision à des conseillers',
    description: 'Autorisé pour un utilisateur support'
  })
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

    handleFailure(result)
  }

  @ApiOperation({
    summary: "Modifie l'agence et les notifications sonores d'un conseiller",
    description:
      'Autorisé pour un conseiller - Ne supprime pas les champs quand ils sont vides'
  })
  @Put(':idConseiller')
  @ApiResponse({
    type: DetailConseillerQueryModel
  })
  @ApiBody({
    type: DetailConseillerPayload
  })
  async modiferConseiller(
    @Param('idConseiller') idConseiller: string,
    @Body() modifierConseillerPayload: DetailConseillerPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.modifierConseillerCommandHandler.execute(
      {
        idConseiller: idConseiller,
        agence: modifierConseillerPayload.agence,
        notificationsSonores: modifierConseillerPayload.notificationsSonores
      },
      utilisateur
    )
    handleFailure(result)
  }

  @ApiOperation({
    summary:
      'Réaffecte les jeunes transférés temporairement au conseiller initial',
    description: 'Autorisé pour un conseiller'
  })
  @Post(':idConseiller/recuperer-mes-jeunes')
  @HttpCode(200)
  async recupererJeunes(
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.recupererJeunesDuConseillerCommandHandler.execute(
      {
        idConseiller: idConseiller
      },
      utilisateur
    )
    handleFailure(result)
  }

  @ApiOperation({
    summary: "Permet de modifier l'idPartenaire d'un jeune PE",
    description: 'Autorisé pour un conseiller Pole Emploi et Pass emploi'
  })
  @Put(':idConseiller/jeunes/:idJeune')
  @ApiBody({
    type: PutJeuneDuConseillerPayload
  })
  async modiferJeuneDuConseiller(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    @Param('idConseiller') idConseiller: string,
    @Param('idJeune') idJeune: string,
    @Body() putJeuneDuConseillerPayload: PutJeuneDuConseillerPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.modifierJeuneDuConseillerCommandHandler.execute(
      {
        idPartenaire: putJeuneDuConseillerPayload.idPartenaire,
        idJeune
      },
      utilisateur
    )
    return handleFailure(result)
  }
  @ApiOperation({
    summary: 'Récupère les indicateurs d’un jeune pour une période donnée',
    description: 'Autorisé pour le conseiller du jeune'
  })
  @Get(':idConseiller/jeunes/:idJeune/indicateurs')
  async getIndicateursJeunePourConseiller(
    @Param('idConseiller') idConseiller: string,
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Query()
    getIndicateursPourConseillerQueryParams: GetIndicateursPourConseillerQueryParams
  ): Promise<IndicateursPourConseillerQueryModel> {
    const result = await this.getIndicateursPourConseillerQueryHandler.execute(
      {
        idConseiller,
        idJeune,
        dateDebut: getIndicateursPourConseillerQueryParams.dateDebut,
        dateFin: getIndicateursPourConseillerQueryParams.dateFin
      },
      utilisateur
    )
    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  private buildDateEcheanceV1(): Date {
    const now = this.dateService.now().set({ second: 59, millisecond: 0 })
    return now.plus({ months: 3 }).toJSDate()
  }
}
