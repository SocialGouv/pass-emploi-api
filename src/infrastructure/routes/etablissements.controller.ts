import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { handleResult } from 'src/infrastructure/routes/result.handler'
import { CloturerAnimationCollectiveCommandHandler } from '../../application/commands/cloturer-animation-collective.command.handler'
import { GetJeunesByEtablissementQueryHandler } from '../../application/queries/get-jeunes-by-etablissement.query.handler.db'
import { GetJeunesEtablissementV2QueryHandler } from '../../application/queries/get-jeunes-etablissement-v2.query.handler.db'
import { GetJeunesEtablissementV2QueryModel } from '../../application/queries/query-models/agence.query-model'
import { JeuneQueryModel } from '../../application/queries/query-models/jeunes.query-model'
import {
  AnimationCollectiveQueryModel,
  GetAnimationCollectiveV2QueryModel,
  RendezVousConseillerDetailQueryModel
} from '../../application/queries/query-models/rendez-vous.query-model'
import { GetAnimationsCollectivesV2QueryHandler } from '../../application/queries/rendez-vous/get-animations-collectives-v2.query.handler.db'
import { GetAnimationsCollectivesQueryHandler } from '../../application/queries/rendez-vous/get-animations-collectives.query.handler.db'
import { Authentification } from '../../domain/authentification'
import { DateService } from '../../utils/date-service'
import { Utilisateur } from '../decorators/authenticated.decorator'
import {
  GetAnimationsCollectivesQueryParams,
  GetAnimationsCollectivesV2QueryParams,
  GetJeunesEtablissementV2QueryParams
} from './validation/etablissements.inputs'
import { ClotureAnimationCollectivePayload } from './validation/structures.milo.inputs'

@Controller()
@ApiOAuth2([])
@ApiTags('Etablissements / Agences Milo')
export class EtablissementsController {
  constructor(
    private readonly cloturerAnimationCollectiveCommandHandler: CloturerAnimationCollectiveCommandHandler,
    private readonly getAnimationsCollectivesQueryHandler: GetAnimationsCollectivesQueryHandler,
    private readonly getJeunesEtablissementQueryHandler: GetJeunesByEtablissementQueryHandler,
    private readonly getAnimationsCollectivesV2QueryHandler: GetAnimationsCollectivesV2QueryHandler,
    private readonly getJeunesEtablissementV2QueryHandler: GetJeunesEtablissementV2QueryHandler
  ) {}

  @ApiOperation({
    summary: "Récupère les animations collectives d'un établissement",
    description:
      "Autorisé pour un conseiller appartenant à l'établissement et ses jeunes"
  })
  @Get('etablissements/:idEtablissement/animations-collectives')
  @ApiResponse({
    type: RendezVousConseillerDetailQueryModel,
    isArray: true
  })
  async getAnimationsCollectives(
    @Param('idEtablissement') idEtablissement: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Query()
    getAnimationsCollectivesQueryParams: GetAnimationsCollectivesQueryParams
  ): Promise<AnimationCollectiveQueryModel[]> {
    const result = await this.getAnimationsCollectivesQueryHandler.execute(
      {
        idEtablissement,
        dateDebut: DateService.fromStringToLocaleDateTime(
          getAnimationsCollectivesQueryParams.dateDebut
        ),
        dateFin: DateService.fromStringToLocaleDateTime(
          getAnimationsCollectivesQueryParams.dateFin
        )
      },
      utilisateur
    )

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Clot une animation collective et inscrit les jeunes',
    description:
      "Autorisé pour un conseiller appartenant à l'établissement de l'animation collective"
  })
  @Post('etablissements/animations-collectives/:idAnimationCollective/cloturer')
  async postCloture(
    @Param('idAnimationCollective') idAnimationCollective: string,
    @Body() payload: ClotureAnimationCollectivePayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.cloturerAnimationCollectiveCommandHandler.execute(
      {
        idAnimationCollective,
        idsJeunes: payload.idsJeunes
      },
      utilisateur
    )

    return handleResult(result)
  }

  @ApiOperation({
    summary: "Récupère les jeunes d'un établissement",
    description: "Autorisé pour un conseiller appartenant à l'établissement"
  })
  @Get('etablissements/:idEtablissement/jeunes')
  @ApiResponse({
    type: JeuneQueryModel,
    isArray: true
  })
  async getJeunesDeLEtablissement(
    @Param('idEtablissement') idEtablissement: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<JeuneQueryModel[]> {
    const result = await this.getJeunesEtablissementQueryHandler.execute(
      { idEtablissement },
      utilisateur
    )

    return handleResult(result)
  }

  @ApiOperation({
    summary: "Récupère les animations collectives d'un établissement",
    description:
      "Autorisé pour un conseiller appartenant à l'établissement et ses jeunes"
  })
  @Get('v2/etablissements/:idEtablissement/animations-collectives')
  @ApiResponse({
    type: GetAnimationCollectiveV2QueryModel
  })
  async getAnimationsCollectivesV2(
    @Param('idEtablissement') idEtablissement: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Query()
    getAnimationsCollectivesQueryParams: GetAnimationsCollectivesV2QueryParams
  ): Promise<GetAnimationCollectiveV2QueryModel> {
    const result = await this.getAnimationsCollectivesV2QueryHandler.execute(
      {
        idEtablissement,
        page: getAnimationsCollectivesQueryParams.page,
        limit: getAnimationsCollectivesQueryParams.limit,
        aClore: getAnimationsCollectivesQueryParams.aClore
      },
      utilisateur
    )

    return handleResult(result)
  }

  @ApiOperation({
    summary:
      "Récupère les jeunes d'un établissement avec des filtres optionnels",
    description: "Autorisé pour un conseiller appartenant à l'établissement"
  })
  @Get('v2/etablissements/:idEtablissement/jeunes')
  @ApiResponse({
    type: GetJeunesEtablissementV2QueryModel
  })
  async getJeunesEtablissementsV2(
    @Param('idEtablissement') idEtablissement: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Query()
    getJeunesEtablissementV2QueryParams: GetJeunesEtablissementV2QueryParams
  ): Promise<GetJeunesEtablissementV2QueryModel> {
    const result = await this.getJeunesEtablissementV2QueryHandler.execute(
      {
        idEtablissement,
        page: getJeunesEtablissementV2QueryParams.page,
        limit: getJeunesEtablissementV2QueryParams.limit,
        q: getJeunesEtablissementV2QueryParams.q
      },
      utilisateur
    )

    return handleResult(result)
  }
}
