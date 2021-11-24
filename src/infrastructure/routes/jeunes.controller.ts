import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { ApiTags } from '@nestjs/swagger'
import { GetDetailJeuneQueryHandler } from 'src/application/queries/get-detail-jeune.query.handler'
import { DetailJeuneQueryModel } from 'src/application/queries/query-models/jeunes.query-models'
import {
  CreateActionCommand,
  CreateActionCommandHandler
} from '../../application/commands/create-action.command.handler'
import { LoginJeuneCommandHandler } from '../../application/commands/login-jeune.command.handler'
import { UpdateNotificationTokenCommandHandler } from '../../application/commands/update-notification-token.command.handler'
import { GetActionsByJeuneQueryHandler } from '../../application/queries/get-actions-by-jeune.query.handler'
import { GetAllRendezVousJeuneQueryHandler } from '../../application/queries/get-rendez-vous-jeune.query.handler'
import { GetHomeJeuneHandler } from '../../application/queries/get-home-jeune.query.handler'
import { ActionQueryModel } from '../../application/queries/query-models/action.query-model'
import {
  FavoriExisteDejaError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { isFailure, isSuccess } from '../../building-blocks/types/result'
import { Action } from '../../domain/action'
import { JeuneHomeQueryModel } from '../../domain/jeune'
import { CreateActionAvecStatutPayload } from './validation/conseillers.inputs'
import {
  AddFavoriPayload,
  PutNotificationTokenInput
} from './validation/jeunes.inputs'
import StatutInvalide = Action.StatutInvalide
import { RendezVousQueryModel } from 'src/application/queries/query-models/rendez-vous.query-model'
import {
  AddFavoriOffreEmploiCommand,
  AddFavoriOffreEmploiCommandHandler
} from '../../application/commands/add-favori-offre-emploi.command.handler'

@Controller('jeunes/:idJeune')
@ApiTags('Jeunes')
export class JeunesController {
  constructor(
    private readonly getDetailJeuneQueryHandler: GetDetailJeuneQueryHandler,
    private readonly loginJeuneCommandHandler: LoginJeuneCommandHandler,
    private readonly updateNotificationTokenCommandHandler: UpdateNotificationTokenCommandHandler,
    private readonly getHomeJeuneHandler: GetHomeJeuneHandler,
    private readonly getActionsByJeuneQueryHandler: GetActionsByJeuneQueryHandler,
    private readonly createActionCommandHandler: CreateActionCommandHandler,
    private readonly getAllRendezVousJeuneQueryHandler: GetAllRendezVousJeuneQueryHandler,
    private readonly addFavoriOffreEmploiCommandHandler: AddFavoriOffreEmploiCommandHandler
  ) {}

  @Get()
  async getDetailJeune(
    @Param('idJeune') idJeune: string
  ): Promise<DetailJeuneQueryModel | undefined> {
    const queryModel = await this.getDetailJeuneQueryHandler.execute({
      idJeune
    })
    if (queryModel) {
      return queryModel
    }

    throw new HttpException(`Jeune ${idJeune} not found`, HttpStatus.NOT_FOUND)
  }

  @Post('login')
  async login(
    @Param('idJeune') idJeune: string
  ): Promise<{ id: string; firstName: string; lastName: string }> {
    const jeune = await this.loginJeuneCommandHandler.execute({ idJeune })
    if (!jeune) {
      throw new HttpException(`UNAUTHORIZED`, HttpStatus.UNAUTHORIZED)
    }
    return {
      id: jeune.id,
      firstName: jeune.firstName,
      lastName: jeune.lastName
    }
  }

  @Put('push-notification-token')
  async updateNotificationToken(
    @Param('idJeune') idJeune: string,
    @Body() putNotificationTokenInput: PutNotificationTokenInput
  ): Promise<void> {
    await this.updateNotificationTokenCommandHandler.execute({
      idJeune,
      token: putNotificationTokenInput.registration_token
    })
  }

  @Get('home')
  async getHome(
    @Param('idJeune') idJeune: string
  ): Promise<JeuneHomeQueryModel> {
    return await this.getHomeJeuneHandler.execute({ idJeune })
  }

  @Get('actions')
  async getActions(
    @Param('idJeune') idJeune: string
  ): Promise<ActionQueryModel[]> {
    return await this.getActionsByJeuneQueryHandler.execute({ idJeune })
  }

  @Get('rendezvous')
  async getRendezVous(
    @Param('idJeune') idJeune: string
  ): Promise<RendezVousQueryModel[]> {
    return await this.getAllRendezVousJeuneQueryHandler.execute({ idJeune })
  }

  @Post('action')
  async postNouvelleAction(
    @Param('idJeune') idJeune: string,
    @Body() createActionPayload: CreateActionAvecStatutPayload
  ): Promise<{ id: Action.Id }> {
    const command: CreateActionCommand = {
      contenu: createActionPayload.content,
      idJeune,
      idCreateur: idJeune,
      typeCreateur: Action.TypeCreateur.JEUNE,
      commentaire: createActionPayload.comment,
      statut: createActionPayload.status
    }
    const result = await this.createActionCommandHandler.execute(command)

    if (isSuccess(result)) {
      return {
        id: result.data
      }
    }

    if (isFailure(result)) {
      if (result.error.code === NonTrouveError.CODE) {
        throw new HttpException(result.error.message, HttpStatus.NOT_FOUND)
      }
      if (result.error.code === StatutInvalide.CODE) {
        throw new HttpException(result.error.message, HttpStatus.BAD_REQUEST)
      }
    }

    throw new RuntimeException()
  }

  @Post('favori')
  async postNouveauFavori(
    @Param('idJeune') idJeune: string,
    @Body() addFavoriPayload: AddFavoriPayload
  ): Promise<void> {
    const command: AddFavoriOffreEmploiCommand = {
      idJeune,
      offreEmploi: {
        id: addFavoriPayload.idOffre,
        nomEntreprise: addFavoriPayload.nomEntreprise,
        duree: addFavoriPayload.duree,
        titre: addFavoriPayload.titre,
        alternance: addFavoriPayload.alternance,
        typeContrat: addFavoriPayload.typeContrat,
        localisation: addFavoriPayload.localisation
      }
    }
    const result = await this.addFavoriOffreEmploiCommandHandler.execute(
      command
    )

    if (isFailure(result)) {
      if (result.error.code === NonTrouveError.CODE) {
        throw new HttpException(result.error.message, HttpStatus.NOT_FOUND)
      }
      if (result.error.code === FavoriExisteDejaError.CODE) {
        throw new HttpException(result.error.message, HttpStatus.CONFLICT)
      }
      throw new RuntimeException(result.error.message)
    }
  }
}
