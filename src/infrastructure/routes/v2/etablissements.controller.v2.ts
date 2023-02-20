import {
  GetAnimationsCollectivesV2QueryParams,
  GetJeunesEtablissementV2QueryParams
} from '../validation/etablissements.inputs'
import { GetAnimationCollectiveV2QueryModel } from '../../../application/queries/query-models/rendez-vous.query-model'
import { handleFailure } from '../failure.handler'
import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetJeunesEtablissementV2QueryModel } from '../../../application/queries/query-models/agence.query-model'
import { GetJeunesEtablissementV2QueryHandler } from '../../../application/queries/get-jeunes-etablissement-v2.query.handler.db'
import { GetAnimationsCollectivesV2QueryHandler } from '../../../application/queries/rendez-vous/get-animations-collectives-v2.query.handler.db'
import { Authentification } from '../../../domain/authentification'
import { Utilisateur } from '../../decorators/authenticated.decorator'
import { isSuccess } from '../../../building-blocks/types/result'

@Controller('v2/etablissements')
@ApiOAuth2([])
@ApiTags('Etablissements')
export class EtablissementsControllerV2 {
  constructor(
    private readonly getAnimationsCollectivesQueryHandler: GetAnimationsCollectivesV2QueryHandler,
    private readonly getJeunesEtablissementV2QueryHandler: GetJeunesEtablissementV2QueryHandler
  ) {}

  @ApiOperation({
    summary: "Récupère les animations collectives d'un établissement",
    description:
      "Autorisé pour un conseiller appartenant à l'établissement et ses jeunes"
  })
  @Get(':idEtablissement/animations-collectives')
  @ApiResponse({
    type: GetAnimationCollectiveV2QueryModel
  })
  async getAnimationsCollectivesV2(
    @Param('idEtablissement') idEtablissement: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Query()
    getAnimationsCollectivesQueryParams: GetAnimationsCollectivesV2QueryParams
  ): Promise<GetAnimationCollectiveV2QueryModel> {
    const result = await this.getAnimationsCollectivesQueryHandler.execute(
      {
        idEtablissement,
        page: getAnimationsCollectivesQueryParams.page,
        limit: getAnimationsCollectivesQueryParams.limit,
        aClore: getAnimationsCollectivesQueryParams.aClore
      },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }

    throw handleFailure(result)
  }

  @ApiOperation({
    summary:
      "Récupère les jeunes d'un établissement avec des filtres optionnels.",
    description: "Autorisé pour un conseiller appartenant à l'établissement."
  })
  @Get(':idEtablissement/jeunes')
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

    if (isSuccess(result)) {
      return result.data
    }

    throw handleFailure(result)
  }
}
