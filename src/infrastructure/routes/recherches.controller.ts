import { Body, Controller, Post } from '@nestjs/common'
import { ApiOAuth2, ApiTags } from '@nestjs/swagger'
import {
  CreateRechercheCommand,
  CreateRechercheCommandHandler
} from '../../application/commands/create-recherche.command.handler'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { Authentification } from '../../domain/authentification'
import { Recherche } from 'src/domain/recherche'

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
      idJeune: '',
      type: Recherche.Type.OFFRES_EMPLOI,
      titre: '',
      localisation: '',
      criteres: undefined
    }
    this.createRechercheCommandHandler.execute(command, utilisateur)
  }
}
