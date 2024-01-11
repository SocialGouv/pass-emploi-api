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
  Put
} from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Authentification } from '../../domain/authentification'
import { DeleteActionCommandHandler } from '../../application/commands/action/delete-action.command.handler'
import {
  GetDetailActionQuery,
  GetDetailActionQueryHandler
} from '../../application/queries/action/get-detail-action.query.handler.db'
import {
  ActionQueryModel,
  CommentaireActionQueryModel,
  QualificationActionQueryModel
} from '../../application/queries/query-models/actions.query-model'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { isFailure } from '../../building-blocks/types/result'
import { Utilisateur } from '../decorators/authenticated.decorator'
import {
  AddCommentaireActionPayload,
  QualifierActionPayload,
  UpdateActionPayload
} from './validation/actions.inputs'
import {
  AddCommentaireActionCommand,
  AddCommentaireActionCommandHandler
} from '../../application/commands/action/add-commentaire-action.command.handler'
import { handleFailure } from './result.handler'
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

@Controller('actions')
@ApiOAuth2([])
@ApiTags('Actions')
export class ActionsController {
  constructor(
    private readonly getDetailActionQueryHandler: GetDetailActionQueryHandler,
    private readonly updateActionCommandHandler: UpdateActionCommandHandler,
    private readonly deleteActionCommandHandler: DeleteActionCommandHandler,
    private readonly addCommentaireActionCommandHandler: AddCommentaireActionCommandHandler,
    private readonly getCommentairesActionQueryHandler: GetCommentairesActionQueryHandler,
    private readonly qualifierActionCommandHandler: QualifierActionCommandHandler
  ) {}

  @ApiOperation({
    summary: 'Récupère une action',
    description: 'Autorisé pour un jeune et son conseiller'
  })
  @Get(':idAction')
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
  @Put(':idAction')
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
      codeQualification: updateActionPayload.codeQualification ?? undefined
    }
    const result = await this.updateActionCommandHandler.execute(
      command,
      utilisateur
    )

    if (isFailure(result)) {
      if (result.error.code === NonTrouveError.CODE) {
        throw new HttpException(
          `Action ${idAction} not found`,
          HttpStatus.NOT_FOUND
        )
      }
      throw new HttpException(result.error.message, HttpStatus.BAD_REQUEST)
    }
  }

  @ApiOperation({
    summary: 'Supprime une action',
    description: 'Autorisé pour un jeune et son conseiller'
  })
  @Delete(':idAction')
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
    if (isFailure(result)) {
      throw handleFailure(result)
    }
  }

  @ApiOperation({
    summary: 'Ajoute un commentaire à une action',
    description: 'Autorisé pour un jeune et son conseiller'
  })
  @Post(':idAction/commentaires')
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

    if (isFailure(result)) {
      throw handleFailure(result)
    }

    return toCommentaireQueryModel(result.data)
  }

  @ApiOperation({
    summary: "Récupère les commentaires d'une action",
    description: 'Autorisé pour un jeune et son conseiller'
  })
  @Get(':idAction/commentaires')
  async getCommentairesAction(
    @Param('idAction', new ParseUUIDPipe()) idAction: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<CommentaireActionQueryModel[]> {
    const result = await this.getCommentairesActionQueryHandler.execute(
      { idAction },
      utilisateur
    )

    if (isFailure(result)) {
      throw handleFailure(result)
    }
    return result.data
  }

  @ApiOperation({
    deprecated: true,
    summary: 'Qualifie une action en SNP / non-SNP',
    description: 'Autorisé pour un conseiller'
  })
  @Post(':idAction/qualifier')
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

    if (isFailure(result)) {
      throw handleFailure(result)
    }

    return result.data
  }
}
