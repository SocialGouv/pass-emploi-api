import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { DateTime } from 'luxon'
import {
  AddCandidatureOffreEmploiCommand,
  AddCandidatureOffreEmploiCommandHandler
} from 'src/application/commands/add-candidature-offre-emploi.command.handler'
import {
  AddCandidatureOffreImmersionCommand,
  AddCandidatureOffreImmersionCommandHandler
} from 'src/application/commands/add-candidature-offre-immersion.command.handler'
import {
  AddCandidatureOffreServiceCiviqueCommand,
  AddCandidatureOffreServiceCiviqueCommandHandler
} from 'src/application/commands/add-candidature-offre-service-civique.command.handler'
import {
  AddFavoriOffreEmploiCommand,
  AddFavoriOffreEmploiCommandHandler
} from '../../application/commands/add-favori-offre-emploi.command.handler'
import {
  AddFavoriOffreImmersionCommand,
  AddFavoriOffreImmersionCommandHandler
} from '../../application/commands/add-favori-offre-immersion.command.handler'
import {
  AddFavoriOffreServiceCiviqueCommandHandler,
  AddFavoriServiceCiviqueCommand
} from '../../application/commands/add-favori-offre-service-civique.command.handler'
import {
  DeleteFavoriOffreEmploiCommand,
  DeleteFavoriOffreEmploiCommandHandler
} from '../../application/commands/delete-favori-offre-emploi.command.handler'
import {
  DeleteFavoriOffreImmersionCommand,
  DeleteFavoriOffreImmersionCommandHandler
} from '../../application/commands/delete-favori-offre-immersion.command.handler'
import {
  DeleteFavoriOffreServiceCiviqueCommand,
  DeleteFavoriOffreServiceCiviqueCommandHandler
} from '../../application/commands/delete-favori-offre-service-civique.command.handler'
import {
  GetFavorisJeuneQuery,
  GetFavorisJeuneQueryHandler
} from '../../application/queries/favoris/get-favoris-jeune.query.handler.db'
import { GetMetadonneesFavorisJeuneQueryHandler } from '../../application/queries/favoris/get-metadonnees-favoris-jeune.query.handler.db'
import { GetFavorisOffresEmploiJeuneQueryHandler } from '../../application/queries/get-favoris-offres-emploi-jeune.query.handler.db'
import { GetFavorisOffresImmersionJeuneQueryHandler } from '../../application/queries/get-favoris-offres-immersion-jeune.query.handler.db'
import { GetFavorisServiceCiviqueJeuneQueryHandler } from '../../application/queries/get-favoris-service-civique-jeune.query.handler.db'
import {
  FavorisQueryModel,
  MetadonneesFavorisQueryModel
} from '../../application/queries/query-models/favoris.query-model'
import {
  FavoriOffreEmploiQueryModel,
  OffreEmploiResumeQueryModel
} from '../../application/queries/query-models/offres-emploi.query-model'
import {
  FavoriOffreImmersionQueryModel,
  OffreImmersionQueryModel
} from '../../application/queries/query-models/offres-immersion.query-model'
import {
  FavoriOffreServiceCiviqueQueryModel,
  ServiceCiviqueQueryModel
} from '../../application/queries/query-models/service-civique.query-model'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { CustomSwaggerApiOAuth2 } from '../decorators/swagger.decorator'
import { handleResult } from './result.handler'
import {
  AddFavoriImmersionPayload,
  AddFavoriOffresEmploiPayload,
  AddFavoriServicesCivique,
  GetFavorisQueryParams
} from './validation/favoris.inputs'

@Controller('jeunes/:idJeune')
@CustomSwaggerApiOAuth2()
@ApiTags('Favoris')
export class FavorisController {
  constructor(
    private readonly getFavorisJeuneQueryHandler: GetFavorisJeuneQueryHandler,
    private readonly getFavorisOffresEmploiJeuneQueryHandler: GetFavorisOffresEmploiJeuneQueryHandler,
    private readonly getFavorisOffresImmersionJeuneQueryHandler: GetFavorisOffresImmersionJeuneQueryHandler,
    private readonly getFavorisServiceCiviqueJeuneQueryHandler: GetFavorisServiceCiviqueJeuneQueryHandler,
    private readonly getMetadonneesFavorisJeuneQueryHandler: GetMetadonneesFavorisJeuneQueryHandler,
    private readonly addFavoriOffreEmploiCommandHandler: AddFavoriOffreEmploiCommandHandler,
    private readonly addFavoriOffreImmersionCommandHandler: AddFavoriOffreImmersionCommandHandler,
    private readonly addFavoriOffreEngagementCommandHandler: AddFavoriOffreServiceCiviqueCommandHandler,
    private readonly addCandidatureOffreEmploiCommandHandler: AddCandidatureOffreEmploiCommandHandler,
    private readonly addCandidatureOffreImmersionCommandHandler: AddCandidatureOffreImmersionCommandHandler,
    private readonly addCandidatureOffreServiceCiviqueCommandHandler: AddCandidatureOffreServiceCiviqueCommandHandler,
    private readonly deleteFavoriOffreEmploiCommandHandler: DeleteFavoriOffreEmploiCommandHandler,
    private readonly deleteFavoriOffreImmersionCommandHandler: DeleteFavoriOffreImmersionCommandHandler,
    private readonly deleteFavoriOffreEngagementCommandHandler: DeleteFavoriOffreServiceCiviqueCommandHandler
  ) {}

  @ApiOperation({
    summary: "Récupère tous les favoris d'un jeune",
    description: 'Autorisé pour le jeune et son conseiller'
  })
  @ApiResponse({
    type: FavorisQueryModel,
    isArray: true
  })
  @Get('favoris')
  async getFavorisDuJeune(
    @Param('idJeune') idJeune: string,
    @Query() getFavorisQueryParams: GetFavorisQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<FavorisQueryModel[]> {
    const query: GetFavorisJeuneQuery = {
      idJeune,
      dateDebut: getFavorisQueryParams.dateDebut
        ? DateTime.fromISO(getFavorisQueryParams.dateDebut)
        : undefined,
      dateFin: getFavorisQueryParams.dateFin
        ? DateTime.fromISO(getFavorisQueryParams.dateFin)
        : undefined
    }
    return this.getFavorisJeuneQueryHandler.execute(query, utilisateur)
  }

  @ApiOperation({
    summary: "Récupère les favoris d'offres d'emploi",
    description: 'Autorisé pour un jeune'
  })
  @ApiResponse({
    type: OffreEmploiResumeQueryModel,
    isArray: true
  })
  @Get('favoris/offres-emploi')
  async getFavorisOffresEmploi(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<FavoriOffreEmploiQueryModel[]> {
    return this.getFavorisOffresEmploiJeuneQueryHandler.execute(
      { idJeune },
      utilisateur
    )
  }

  @ApiOperation({
    summary: "Récupère les favoris d'offres d'immersion",
    description: 'Autorisé pour un jeune'
  })
  @ApiResponse({
    type: OffreImmersionQueryModel,
    isArray: true
  })
  @Get('favoris/offres-immersion')
  async getFavorisOffresImmersion(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<FavoriOffreImmersionQueryModel[]> {
    return this.getFavorisOffresImmersionJeuneQueryHandler.execute(
      { idJeune },
      utilisateur
    )
  }

  @ApiOperation({
    summary: "Récupère les favoris d'offres de service civique",
    description: 'Autorisé pour un jeune'
  })
  @ApiResponse({
    type: ServiceCiviqueQueryModel,
    isArray: true
  })
  @Get('favoris/services-civique')
  async getFavorisServicesCivique(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<FavoriOffreServiceCiviqueQueryModel[]> {
    return this.getFavorisServiceCiviqueJeuneQueryHandler.execute(
      { idJeune },
      utilisateur
    )
  }

  @ApiOperation({
    summary: 'Récupère les métadonnées des favoris du jeune',
    description: 'Autorisé pour un conseiller du jeune'
  })
  @Get('favoris/metadonnees')
  @ApiResponse({ type: MetadonneesFavorisQueryModel })
  async getMetadonneesFavorisJeune(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<MetadonneesFavorisQueryModel> {
    const result = await this.getMetadonneesFavorisJeuneQueryHandler.execute(
      { idJeune },
      utilisateur
    )

    return handleResult(result)
  }

  @Post('favoris/offres-emploi')
  async postNouveauFavoriOffresEmploi(
    @Param('idJeune') idJeune: string,
    @Body() addFavoriPayload: AddFavoriOffresEmploiPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
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
        localisation: addFavoriPayload.localisation,
        origine: addFavoriPayload.origineNom
          ? {
              nom: addFavoriPayload.origineNom,
              logo: addFavoriPayload.origineLogo
            }
          : undefined
      },
      aPostule: Boolean(addFavoriPayload.aPostule)
    }
    const result = await this.addFavoriOffreEmploiCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }

  @Post('favoris/offres-immersion')
  async postNouveauFavoriOffresImmersion(
    @Param('idJeune') idJeune: string,
    @Body() addFavoriPayload: AddFavoriImmersionPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: AddFavoriOffreImmersionCommand = {
      idJeune,
      offreImmersion: {
        id: addFavoriPayload.idOffre,
        metier: addFavoriPayload.metier,
        nomEtablissement: addFavoriPayload.nomEtablissement,
        secteurActivite: addFavoriPayload.secteurActivite,
        ville: addFavoriPayload.ville
      },
      aPostule: Boolean(addFavoriPayload.aPostule)
    }
    const result = await this.addFavoriOffreImmersionCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }

  @Post('favoris/services-civique')
  async postNouveauFavoriServicesCivique(
    @Param('idJeune') idJeune: string,
    @Body() addFavoriPayload: AddFavoriServicesCivique,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const { aPostule, ...offre } = addFavoriPayload
    const command: AddFavoriServiceCiviqueCommand = {
      idJeune,
      offre,
      aPostule: Boolean(aPostule)
    }
    const result = await this.addFavoriOffreEngagementCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }

  @Patch('favoris/offres-emploi/:idOffre')
  async patchFavoriOffresEmploi(
    @Param('idJeune') idBeneficiaire: string,
    @Param('idOffre') idOffre: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: AddCandidatureOffreEmploiCommand = {
      idBeneficiaire,
      idOffre
    }
    const result = await this.addCandidatureOffreEmploiCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }

  @Patch('favoris/offres-immersion/:idOffre')
  async patchFavoriOffresImmersion(
    @Param('idJeune') idBeneficiaire: string,
    @Param('idOffre') idOffre: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: AddCandidatureOffreImmersionCommand = {
      idBeneficiaire,
      idOffre
    }
    const result =
      await this.addCandidatureOffreImmersionCommandHandler.execute(
        command,
        utilisateur
      )

    return handleResult(result)
  }

  @Patch('favoris/service-civique/:idOffre')
  async patchFavoriServiceCivique(
    @Param('idJeune') idBeneficiaire: string,
    @Param('idOffre') idOffre: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: AddCandidatureOffreServiceCiviqueCommand = {
      idBeneficiaire,
      idOffre
    }
    const result =
      await this.addCandidatureOffreServiceCiviqueCommandHandler.execute(
        command,
        utilisateur
      )

    return handleResult(result)
  }

  @Delete('favoris/offres-emploi/:idOffreEmploi')
  @HttpCode(204)
  async deleteFavoriOffreEmploi(
    @Param('idJeune') idJeune: string,
    @Param('idOffreEmploi') idOffreEmploi: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: DeleteFavoriOffreEmploiCommand = {
      idJeune,
      idOffreEmploi
    }
    const result = await this.deleteFavoriOffreEmploiCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }

  @Delete('favoris/offres-immersion/:idOffreImmersion')
  @HttpCode(204)
  async deleteFavoriOffreImmersion(
    @Param('idJeune') idJeune: string,
    @Param('idOffreImmersion') idOffreImmersion: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: DeleteFavoriOffreImmersionCommand = {
      idJeune,
      idOffreImmersion
    }

    const result = await this.deleteFavoriOffreImmersionCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }

  @Delete('favoris/services-civique/:idOffre')
  @HttpCode(204)
  async deleteFavoriServiceCivique(
    @Param('idJeune') idJeune: string,
    @Param('idOffre') idOffre: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: DeleteFavoriOffreServiceCiviqueCommand = {
      idJeune,
      idOffre
    }

    const result = await this.deleteFavoriOffreEngagementCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }
}
