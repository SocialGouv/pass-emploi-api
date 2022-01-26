import { Body, Controller, Post } from '@nestjs/common'
import { ApiOAuth2, ApiTags } from '@nestjs/swagger'
import {
  CreateRechercheCommand,
  CreateRechercheCommandHandler
} from '../../application/commands/create-recherche.command.handler'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { Authentification } from '../../domain/authentification'
import { CreateRecherchePayload } from './validation/recherches.inputs'

@Controller('recherches')
@ApiOAuth2([])
@ApiTags('Recherches')
export class RecherchesController {
  constructor(
    private readonly createRechercheCommandHandler: CreateRechercheCommandHandler
  ) {}

  @Post()
  async creerRecherche(
    @Body() createRecherchePayload: CreateRecherchePayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: CreateRechercheCommand = {
      metier: createRecherchePayload.metier,
      idJeune: createRecherchePayload.idJeune,
      type: createRecherchePayload.type,
      titre: createRecherchePayload.titre,
      localisation: createRecherchePayload.localisation,
      criteres: createRecherchePayload.criteres
    }
    this.createRechercheCommandHandler.execute(command, utilisateur)
  }
}
