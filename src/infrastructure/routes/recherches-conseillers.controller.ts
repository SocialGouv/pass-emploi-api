import { Body, Controller, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { handleResult } from 'src/infrastructure/routes/result.handler'
import {
  CreateSuggestionConseillerImmersionCommand,
  CreateSuggestionConseillerImmersionCommandHandler
} from '../../application/commands/create-suggestion-conseiller-immersion.command.handler'
import {
  CreateSuggestionConseillerOffreEmploiCommand,
  CreateSuggestionConseillerOffreEmploiCommandHandler
} from '../../application/commands/create-suggestion-conseiller-offre-emploi.command.handler'
import {
  CreateSuggestionConseillerServiceCiviqueCommand,
  CreateSuggestionConseillerServiceCiviqueCommandHandler
} from '../../application/commands/create-suggestion-conseiller-service-civique.command.handler'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { CustomSwaggerApiOAuth2 } from '../decorators/swagger.decorator'
import {
  CreateSuggestionImmersionsPayload,
  CreateSuggestionOffresEmploiPayload,
  CreateSuggestionServicesCiviquePayload
} from './validation/recherches.inputs'

@Controller('conseillers/:idConseiller')
@CustomSwaggerApiOAuth2()
@ApiTags('Recherches')
export class RecherchesConseillersController {
  constructor(
    private readonly createSuggestionConseillerOffreEmploiCommandHandler: CreateSuggestionConseillerOffreEmploiCommandHandler,
    private readonly createSuggestionConseillerImmersionCommandHandler: CreateSuggestionConseillerImmersionCommandHandler,
    private readonly createSuggestionConseillerServiceCiviqueCommandHandler: CreateSuggestionConseillerServiceCiviqueCommandHandler
  ) {}

  @ApiOperation({
    summary: "Crée une suggestion de recherche d'offre d'emploi",
    description: 'Autorisé pour le conseiller'
  })
  @Post('recherches/suggestions/offres-emploi')
  async creerSuggestionOffreEmploi(
    @Body() createSuggestionPayload: CreateSuggestionOffresEmploiPayload,
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: CreateSuggestionConseillerOffreEmploiCommand = {
      idConseiller,
      idsJeunes: createSuggestionPayload.idsJeunes,
      titre: createSuggestionPayload.titre,
      metier: createSuggestionPayload.metier,
      localisation: createSuggestionPayload.localisation,
      criteres: {
        q: createSuggestionPayload.q,
        commune: createSuggestionPayload.commune,
        departement: createSuggestionPayload.departement,
        alternance: createSuggestionPayload.alternance
      }
    }
    const result =
      await this.createSuggestionConseillerOffreEmploiCommandHandler.execute(
        command,
        utilisateur
      )

    return handleResult(result)
  }

  @ApiOperation({
    summary: "Crée une suggestion de recherche d'offre d'emploi",
    description: 'Autorisé pour le conseiller'
  })
  @Post('recherches/suggestions/immersions')
  async creerSuggestionImmersion(
    @Body() createSuggestionPayload: CreateSuggestionImmersionsPayload,
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: CreateSuggestionConseillerImmersionCommand = {
      idConseiller,
      idsJeunes: createSuggestionPayload.idsJeunes,
      titre: createSuggestionPayload.titre,
      metier: createSuggestionPayload.metier,
      localisation: createSuggestionPayload.localisation,
      criteres: {
        rome: createSuggestionPayload.rome,
        lat: createSuggestionPayload.lat,
        lon: createSuggestionPayload.lon
      }
    }
    const result =
      await this.createSuggestionConseillerImmersionCommandHandler.execute(
        command,
        utilisateur
      )

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Crée une suggestion de recherche de service civique',
    description: 'Autorisé pour le conseiller'
  })
  @Post('recherches/suggestions/services-civique')
  async creerSuggestionServiceCivique(
    @Body()
    createSuggestionPayload: CreateSuggestionServicesCiviquePayload,
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: CreateSuggestionConseillerServiceCiviqueCommand = {
      idConseiller,
      idsJeunes: createSuggestionPayload.idsJeunes,
      titre: createSuggestionPayload.titre,
      metier: createSuggestionPayload.metier,
      localisation: createSuggestionPayload.localisation,
      criteres: {
        lat: createSuggestionPayload.lat,
        lon: createSuggestionPayload.lon
      }
    }
    const result =
      await this.createSuggestionConseillerServiceCiviqueCommandHandler.execute(
        command,
        utilisateur
      )

    return handleResult(result)
  }
}
