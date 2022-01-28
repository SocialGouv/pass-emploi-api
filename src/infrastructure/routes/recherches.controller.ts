import { Body, Controller, Param, Post } from '@nestjs/common'
import { ApiOAuth2, ApiTags } from '@nestjs/swagger'
import {
  CreateRechercheCommand,
  CreateRechercheCommandHandler
} from '../../application/commands/create-recherche.command.handler'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { Authentification } from '../../domain/authentification'
import { CreateRecherchePayload } from './validation/recherches.inputs'

@Controller('jeunes/:idJeune')
@ApiOAuth2([])
@ApiTags('Recherches')
export class RecherchesController {
  constructor(
    private readonly createRechercheCommandHandler: CreateRechercheCommandHandler
  ) {}

  @Post('recherches')
  async creerRecherche(
    @Body() createRecherchePayload: CreateRecherchePayload,
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: CreateRechercheCommand = {
      metier: createRecherchePayload.metier,
      idJeune: idJeune,
      type: createRecherchePayload.type,
      titre: createRecherchePayload.titre,
      localisation: createRecherchePayload.localisation,
      criteres: createRecherchePayload.criteres
    }
    this.createRechercheCommandHandler.execute(command, utilisateur)
  }
}
