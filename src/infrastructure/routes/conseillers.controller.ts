import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { DateTime } from 'luxon'
import {
  CreateActionCommand,
  CreateActionCommandHandler
} from '../../application/commands/action/create-action.command.handler'
import { DeleteConseillerCommandHandler } from '../../application/commands/conseiller/delete-conseiller.command.handler'
import {
  CreateListeDeDiffusionCommand,
  CreateListeDeDiffusionCommandHandler
} from '../../application/commands/create-liste-de-diffusion.command.handler'
import {
  CreerRendezVousCommand,
  CreerRendezVousCommandHandler
} from '../../application/commands/rendez-vous/creer-rendez-vous.command.handler'
import { ModifierConseillerCommandHandler } from '../../application/commands/modifier-conseiller.command.handler'
import { ModifierJeuneDuConseillerCommandHandler } from '../../application/commands/modifier-jeune-du-conseiller.command.handler'
import { RecupererJeunesDuConseillerCommandHandler } from '../../application/commands/recuperer-jeunes-du-conseiller.command.handler'
import {
  SendNotificationsNouveauxMessagesCommand,
  SendNotificationsNouveauxMessagesCommandHandler
} from '../../application/commands/send-notifications-nouveaux-messages.command.handler'
import { GetResumeActionsDesJeunesDuConseillerQueryHandlerDb } from '../../application/queries/action/get-resume-actions-des-jeunes-du-conseiller.query.handler.db'
import { GetConseillersQueryHandler } from '../../application/queries/get-conseillers.query.handler.db'
import { GetDetailConseillerQueryHandler } from '../../application/queries/get-detail-conseiller.query.handler.db'
import {
  GetIndicateursPourConseillerExclusionQuery,
  GetIndicateursPourConseillerQueryHandler
} from '../../application/queries/get-indicateurs-pour-conseiller.query.handler.db'
import { GetJeunesByConseillerQueryHandler } from '../../application/queries/get-jeunes-by-conseiller.query.handler.db'
import { GetJeunesIdentitesQueryHandler } from '../../application/queries/get-jeunes-identites.query.handler.db'
import {
  ConseillerSimpleQueryModel,
  DetailConseillerQueryModel
} from '../../application/queries/query-models/conseillers.query-model'
import { IndicateursPourConseillerQueryModel } from '../../application/queries/query-models/indicateurs-pour-conseiller.query-model'
import {
  DetailJeuneConseillerQueryModel,
  IdentiteJeuneQueryModel,
  ResumeActionsDuJeuneQueryModel
} from '../../application/queries/query-models/jeunes.query-model'
import { RendezVousConseillerFutursEtPassesQueryModel } from '../../application/queries/query-models/rendez-vous.query-model'
import { GetAllRendezVousConseillerQueryHandler } from '../../application/queries/rendez-vous/get-rendez-vous-conseiller.query.handler.db'
import {
  Result,
  isFailure,
  isSuccess
} from '../../building-blocks/types/result'
import { Action } from '../../domain/action/action'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import { DateService } from '../../utils/date-service'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './result.handler'
import { CreateActionPayload } from './validation/actions.inputs'
import {
  CreateListeDeDiffusionPayload,
  DetailConseillerPayload,
  EnvoyerNotificationsPayload,
  GetConseillersQueryParams,
  GetIdentitesJeunesQueryParams,
  GetIndicateursPourConseillerQueryParams,
  GetRendezVousConseillerQueryParams,
  PutJeuneDuConseillerPayload
} from './validation/conseillers.inputs'
import { CreerRendezVousPayload } from './validation/rendez-vous.inputs'

@Controller('conseillers')
@ApiOAuth2([])
@ApiTags('Conseillers')
export class ConseillersController {
  constructor(
    private readonly dateService: DateService,
    private readonly getDetailConseillerQueryHandler: GetDetailConseillerQueryHandler,
    private readonly getConseillersQueryHandler: GetConseillersQueryHandler,
    private readonly getJeunesByConseillerQueryHandler: GetJeunesByConseillerQueryHandler,
    private readonly getResumeActionsDesJeunesDuConseillerQueryHandler: GetResumeActionsDesJeunesDuConseillerQueryHandlerDb,
    private readonly createActionCommandHandler: CreateActionCommandHandler,
    private readonly sendNotificationsNouveauxMessages: SendNotificationsNouveauxMessagesCommandHandler,
    private readonly getAllRendezVousConseillerQueryHandler: GetAllRendezVousConseillerQueryHandler,
    private readonly creerRendezVousCommandHandler: CreerRendezVousCommandHandler,
    private readonly modifierConseillerCommandHandler: ModifierConseillerCommandHandler,
    private readonly recupererJeunesDuConseillerCommandHandler: RecupererJeunesDuConseillerCommandHandler,
    private readonly modifierJeuneDuConseillerCommandHandler: ModifierJeuneDuConseillerCommandHandler,
    private readonly getIndicateursPourConseillerQueryHandler: GetIndicateursPourConseillerQueryHandler,
    private readonly createListeDeDiffusionCommandHandler: CreateListeDeDiffusionCommandHandler,
    private readonly getIdentitesJeunesQueryHandler: GetJeunesIdentitesQueryHandler,
    private readonly deleteConseillerCommandHandler: DeleteConseillerCommandHandler
  ) {}

  @ApiOperation({
    summary: 'Supprime un conseiller',
    description: 'Autorisé pour un conseiller'
  })
  @Delete(':idConseiller')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConseiller(
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.deleteConseillerCommandHandler.execute(
      {
        idConseiller
      },
      utilisateur
    )
    handleFailure(result)
  }

  @ApiOperation({
    summary:
      'Recherche des conseillers par email ou par nom/prénom dans une même structure',
    description: 'Autorisé pour un Conseiller Superviseur'
  })
  @Get()
  @ApiResponse({
    type: ConseillerSimpleQueryModel,
    isArray: true
  })
  async getConseillers(
    @Query() queryParams: GetConseillersQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<ConseillerSimpleQueryModel[]> {
    const result = await this.getConseillersQueryHandler.execute(
      {
        recherche: queryParams.q,
        structureDifferenteRecherchee:
          queryParams.structure as Core.StructuresPoleEmploiBRSA
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
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<DetailConseillerQueryModel> {
    const result = await this.getDetailConseillerQueryHandler.execute(
      {
        idConseiller,
        structure: utilisateur.structure,
        accessToken: accessToken
      },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }

    throw handleFailure(result)
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
      dateEcheance: createActionPayload.dateEcheance
        ? DateTime.fromISO(createActionPayload.dateEcheance, { setZone: true })
        : this.buildDateEcheanceV1(),
      codeQualification: createActionPayload.codeQualification
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
    summary: 'Crée un rendez-vous ou une animation collective pour des jeunes',
    description: 'Autorisé pour un conseiller'
  })
  @Post(':idConseiller/rendezvous')
  async creerRendezVous(
    @Param('idConseiller') idConseiller: string,
    @Body() creerRendezVousPayload: CreerRendezVousPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<Core.Id> {
    const command: CreerRendezVousCommand = {
      idsJeunes: creerRendezVousPayload.jeunesIds,
      commentaire: creerRendezVousPayload.comment,
      date: creerRendezVousPayload.date,
      duree: creerRendezVousPayload.duration,
      idConseiller: idConseiller,
      modalite: creerRendezVousPayload.modality,
      titre: creerRendezVousPayload.titre,
      type: creerRendezVousPayload.type,
      precision: creerRendezVousPayload.precision,
      adresse: creerRendezVousPayload.adresse,
      organisme: creerRendezVousPayload.organisme,
      presenceConseiller: creerRendezVousPayload.presenceConseiller,
      invitation: creerRendezVousPayload.invitation,
      nombreMaxParticipants: creerRendezVousPayload.nombreMaxParticipants
    }

    const result: Result<string> =
      await this.creerRendezVousCommandHandler.execute(command, utilisateur)

    if (isSuccess(result)) {
      return { id: result.data }
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary:
      "Permet d'ajouter l'agence ou de modifier les notifications sonores ou la date de signature des CGU d'un conseiller",
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
        notificationsSonores: modifierConseillerPayload.notificationsSonores,
        dateSignatureCGU: modifierConseillerPayload.dateSignatureCGU
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
    @Param('idConseiller') _idConseiller: string,
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
    let exclure: GetIndicateursPourConseillerExclusionQuery | undefined
    if (
      getIndicateursPourConseillerQueryParams.exclureOffresEtFavoris !==
      undefined
    ) {
      exclure = {
        offresEtFavoris:
          getIndicateursPourConseillerQueryParams.exclureOffresEtFavoris
      }
    }
    const result = await this.getIndicateursPourConseillerQueryHandler.execute(
      {
        idConseiller,
        idJeune,
        dateDebut: getIndicateursPourConseillerQueryParams.dateDebut,
        dateFin: getIndicateursPourConseillerQueryParams.dateFin,
        exclure
      },
      utilisateur
    )
    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary: 'Crée une liste de diffusion',
    description:
      'Autorisé pour le conseiller avec les bénéficiaires de son portefeuille.'
  })
  @Post(':idConseiller/listes-de-diffusion')
  async getListesDeDiffusion(
    @Param('idConseiller')
    idConseiller: string,
    @Body()
    payload: CreateListeDeDiffusionPayload,
    @Utilisateur()
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: CreateListeDeDiffusionCommand = {
      idConseiller,
      titre: payload.titre,
      idsBeneficiaires: payload.idsBeneficiaires
    }
    const result = await this.createListeDeDiffusionCommandHandler.execute(
      command,
      utilisateur
    )

    if (isFailure(result)) {
      throw handleFailure(result)
    }
  }

  @ApiOperation({
    summary: 'Récupère nom et prénom de certains jeunes d’un conseiller',
    description: 'Autorisé pour un conseiller'
  })
  @Get(':idConseiller/jeunes/identites')
  async getIdentitesJeunes(
    @Param('idConseiller') idConseiller: string,
    @Query() getIdentitesJeunesQueryParams: GetIdentitesJeunesQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<IdentiteJeuneQueryModel[]> {
    const query = {
      idConseiller,
      idsJeunes: getIdentitesJeunesQueryParams.ids
    }
    const result = await this.getIdentitesJeunesQueryHandler.execute(
      query,
      utilisateur
    )

    if (isFailure(result)) {
      throw handleFailure(result)
    }
    return result.data
  }

  private buildDateEcheanceV1(): DateTime {
    const now = this.dateService.now().set({ second: 59, millisecond: 0 })
    return now.plus({ months: 3 })
  }
}
