import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query
} from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { handleResult } from 'src/infrastructure/routes/result.handler'
import { Authentification } from '../../domain/authentification'
import { DeleteActionCommandHandler } from '../../application/commands/action/delete-action.command.handler'
import {
  GetDetailActionQuery,
  GetDetailActionQueryHandler
} from '../../application/queries/action/get-detail-action.query.handler.db'
import {
  ActionQueryModel,
  CommentaireActionQueryModel,
  ListeActionsV2QueryModel,
  QualificationActionQueryModel
} from '../../application/queries/query-models/actions.query-model'
import { Result } from '../../building-blocks/types/result'
import { Utilisateur } from '../decorators/authenticated.decorator'
import {
  AddCommentaireActionPayload,
  CreateActionParLeJeunePayload,
  CreateActionPayload,
  QualifierActionPayload,
  UpdateActionPayload
} from './validation/actions.inputs'
import {
  AddCommentaireActionCommand,
  AddCommentaireActionCommandHandler
} from '../../application/commands/action/add-commentaire-action.command.handler'
import { GetCommentairesActionQueryHandler } from '../../application/queries/action/get-commentaires-action.query.handler.db'
import {
  QualifierActionCommand,
  QualifierActionCommandHandler
} from '../../application/commands/milo/qualifier-action.command.handler'
import { DateTime } from 'luxon'
import { toCommentaireQueryModel } from '../../application/queries/query-mappers/commentaire.mapper'
import {
  UpdateActionCommand,
  UpdateActionCommandHandler
} from 'src/application/commands/action/update-action.command.handler'
import {
  CreateActionCommandHandler,
  CreateActionCommand
} from '../../application/commands/action/create-action.command.handler'
import { GetResumeActionsDesJeunesDuConseillerQueryHandlerDb } from '../../application/queries/action/get-resume-actions-des-jeunes-du-conseiller.query.handler.db'
import { ResumeActionsDuJeuneQueryModel } from '../../application/queries/query-models/jeunes.query-model'
import { Action } from '../../domain/action/action'
import { DateService } from '../../utils/date-service'
import { GetActionsConseillerV2QueryHandler } from '../../application/queries/action/get-actions-conseiller-v2.query.handler.db'
import { GetActionsConseillerV2QueryModel } from '../../application/queries/query-models/conseillers.query-model'
import { GetActionsConseillerV2QueryParams } from './validation/conseillers.inputs'
import {
  GetActionsJeuneQueryHandler,
  GetActionsJeuneQuery
} from '../../application/queries/action/get-actions-jeune.query.handler.db'
import { GetActionsByJeuneV2QueryParams } from './validation/jeunes.inputs'
import { IdQueryModel } from '../../application/queries/query-models/common.query-models'
import { Core } from '../../domain/core'

@Controller()
@ApiOAuth2([])
@ApiTags('Actions du CEJ pour Milo / Pass Emploi')
export class ActionsController {
  constructor(
    private readonly dateService: DateService,
    private readonly getDetailActionQueryHandler: GetDetailActionQueryHandler,
    private readonly updateActionCommandHandler: UpdateActionCommandHandler,
    private readonly deleteActionCommandHandler: DeleteActionCommandHandler,
    private readonly addCommentaireActionCommandHandler: AddCommentaireActionCommandHandler,
    private readonly getCommentairesActionQueryHandler: GetCommentairesActionQueryHandler,
    private readonly qualifierActionCommandHandler: QualifierActionCommandHandler,
    private readonly getResumeActionsDesJeunesDuConseillerQueryHandler: GetResumeActionsDesJeunesDuConseillerQueryHandlerDb,
    private readonly createActionCommandHandler: CreateActionCommandHandler,
    private readonly getActionsDuConseillerQueryHandler: GetActionsConseillerV2QueryHandler,
    private readonly getActionsByJeuneQueryHandler: GetActionsJeuneQueryHandler
  ) {}

  @ApiOperation({
    summary: 'Récupère une action',
    description: 'Autorisé pour un jeune et son conseiller'
  })
  @Get('actions/:idAction')
  @ApiResponse({
    type: ActionQueryModel
  })
  async getDetailAction(
    @Param('idAction', new ParseUUIDPipe()) idAction: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<ActionQueryModel> {
    const query: GetDetailActionQuery = { idAction }
    const queryModel = await this.getDetailActionQueryHandler.execute(
      query,
      utilisateur
    )
    if (queryModel) {
      return queryModel
    }

    throw new HttpException(
      `Action ${idAction} not found`,
      HttpStatus.NOT_FOUND
    )
  }

  @ApiOperation({
    summary: 'Modifie une action',
    description: 'Autorisé pour un jeune et son conseiller'
  })
  @Put('actions/:idAction')
  async updateAction(
    @Param('idAction', new ParseUUIDPipe()) idAction: string,
    @Body() updateActionPayload: UpdateActionPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: UpdateActionCommand = {
      idAction,
      statut: updateActionPayload.status,
      contenu: updateActionPayload.contenu,
      description: updateActionPayload.description,
      dateEcheance: updateActionPayload.dateEcheance
        ? DateTime.fromISO(updateActionPayload.dateEcheance, { setZone: true })
        : undefined,
      dateFinReelle: updateActionPayload.dateFinReelle
        ? DateTime.fromISO(updateActionPayload.dateFinReelle, { setZone: true })
        : undefined,
      codeQualification: updateActionPayload.codeQualification ?? undefined
    }
    const result = await this.updateActionCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Supprime une action',
    description: 'Autorisé pour un jeune et son conseiller'
  })
  @Delete('actions/:idAction')
  @HttpCode(204)
  async deleteAction(
    @Param('idAction', new ParseUUIDPipe()) idAction: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.deleteActionCommandHandler.execute(
      {
        idAction
      },
      utilisateur
    )

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Ajoute un commentaire à une action',
    description: 'Autorisé pour un jeune et son conseiller'
  })
  @Post('actions/:idAction/commentaires')
  async addCommentaireAction(
    @Param('idAction', new ParseUUIDPipe()) idAction: string,
    @Body() addCommentaireActionPayload: AddCommentaireActionPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<CommentaireActionQueryModel> {
    const command: AddCommentaireActionCommand = {
      idAction,
      commentaire: addCommentaireActionPayload.commentaire,
      createur: utilisateur
    }

    const result = await this.addCommentaireActionCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result, toCommentaireQueryModel)
  }

  @ApiOperation({
    summary: "Récupère les commentaires d'une action",
    description: 'Autorisé pour un jeune et son conseiller'
  })
  @Get('actions/:idAction/commentaires')
  async getCommentairesAction(
    @Param('idAction', new ParseUUIDPipe()) idAction: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<CommentaireActionQueryModel[]> {
    const result = await this.getCommentairesActionQueryHandler.execute(
      { idAction },
      utilisateur
    )

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Qualifie une action en SNP / non-SNP',
    description: 'Autorisé pour un conseiller'
  })
  @Post('actions/:idAction/qualifier')
  async qualifierAction(
    @Param('idAction', new ParseUUIDPipe()) idAction: string,
    @Body() qualifierActionPayload: QualifierActionPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<QualificationActionQueryModel> {
    const dateDebut = qualifierActionPayload.dateDebut
      ? DateTime.fromISO(qualifierActionPayload.dateDebut, {
          setZone: true
        })
      : undefined
    const dateFinReelle = qualifierActionPayload.dateFinReelle
      ? DateTime.fromISO(qualifierActionPayload.dateFinReelle, {
          setZone: true
        })
      : undefined

    const command: QualifierActionCommand = {
      idAction,
      codeQualification: qualifierActionPayload.codeQualification,
      commentaireQualification: qualifierActionPayload.commentaireQualification,
      dateDebut,
      dateFinReelle,
      utilisateur
    }

    const result = await this.qualifierActionCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Crée une action',
    description: 'Autorisé pour un conseiller du jeune'
  })
  @Post('conseillers/:idConseiller/jeunes/:idJeune/action')
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
      statut: createActionPayload.status,
      codeQualification: createActionPayload.codeQualification
    }

    const result = await this.createActionCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result, id => ({ id }))
  }

  @Post('jeunes/:idJeune/action')
  @ApiResponse({
    type: IdQueryModel
  })
  async postNouvelleAction(
    @Param('idJeune') idJeune: string,
    @Body() createActionPayload: CreateActionParLeJeunePayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<Core.Id> {
    const command: CreateActionCommand = {
      contenu: createActionPayload.content,
      idJeune,
      idCreateur: idJeune,
      typeCreateur: Action.TypeCreateur.JEUNE,
      commentaire: createActionPayload.comment,
      statut: createActionPayload.status,
      dateEcheance: createActionPayload.dateEcheance
        ? DateTime.fromISO(createActionPayload.dateEcheance, { setZone: true })
        : this.buildDateEcheanceJeuneV1(createActionPayload.status),
      rappel: createActionPayload.dateEcheance
        ? createActionPayload.rappel
        : false,
      codeQualification: createActionPayload.codeQualification
    }
    const result = await this.createActionCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result, id => ({ id }))
  }

  @ApiOperation({
    summary: "Récupère les actions d'un conseiller",
    description: 'Autorisé pour un conseiller'
  })
  @Get('conseillers/:idConseiller/actions')
  async getActionsConseiller(
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
    summary:
      'Récupère l’ensemble des actions des jeunes du portefeuille du conseiller',
    description: 'Autorisé pour le conseiller'
  })
  @ApiResponse({
    type: GetActionsConseillerV2QueryModel
  })
  @Get('v2/conseillers/:idConseiller/actions')
  async getActionsConseillerV2(
    @Param('idConseiller') idConseiller: string,
    @Query()
    getActionsConseillerV2QueryParams: GetActionsConseillerV2QueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<GetActionsConseillerV2QueryModel> {
    const result: Result<GetActionsConseillerV2QueryModel> =
      await this.getActionsDuConseillerQueryHandler.execute(
        {
          idConseiller,
          page: getActionsConseillerV2QueryParams.page,
          limit: getActionsConseillerV2QueryParams.limit,
          codesCategories: getActionsConseillerV2QueryParams.codesCategories,
          aQualifier: getActionsConseillerV2QueryParams.aQualifier,
          tri: getActionsConseillerV2QueryParams.tri
        },
        utilisateur
      )

    return handleResult(result)
  }

  @Get('v2/jeunes/:idJeune/actions')
  @ApiResponse({
    type: ListeActionsV2QueryModel
  })
  @HttpCode(HttpStatus.PARTIAL_CONTENT)
  async getActionsJeune(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Query() getActionsByJeuneQueryParams: GetActionsByJeuneV2QueryParams
  ): Promise<ListeActionsV2QueryModel> {
    const query: GetActionsJeuneQuery = {
      idJeune,
      page: getActionsByJeuneQueryParams.page,
      tri: getActionsByJeuneQueryParams.tri,
      statuts: getActionsByJeuneQueryParams.statuts,
      etats: getActionsByJeuneQueryParams.etats,
      codesCategories: getActionsByJeuneQueryParams.categories
    }

    const result = await this.getActionsByJeuneQueryHandler.execute(
      query,
      utilisateur
    )

    return handleResult(result)
  }

  private buildDateEcheanceV1(): DateTime {
    const now = this.dateService.now().set({ second: 59, millisecond: 0 })
    return now.plus({ months: 3 })
  }

  private buildDateEcheanceJeuneV1(statutAction?: Action.Statut): DateTime {
    const statutsDone = [Action.Statut.ANNULEE, Action.Statut.TERMINEE]

    const now = this.dateService.now().set({ second: 59, millisecond: 0 })

    if (statutAction && statutsDone.includes(statutAction)) {
      return now
    }
    return now.plus({ months: 3 })
  }
}
