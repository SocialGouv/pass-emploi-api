import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOAuth2, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { GetAnimationCollectiveV2QueryModel } from 'src/application/queries/query-models/rendez-vous.query-model'
import { GetAnimationsCollectivesV2QueryHandler } from 'src/application/queries/rendez-vous/get-animations-collectives-v2.query.handler.db'
import { isSuccess } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Utilisateur } from 'src/infrastructure/decorators/authenticated.decorator'
import { handleFailure } from '../failure.handler'
import { GetAnimationsCollectivesV2QueryParams } from '../validation/etablissements.inputs'

@Controller('v2/etablissements')
@ApiOAuth2([])
@ApiTags('Etablissements')
export class EtablissementsControllerV2 {
  constructor(
    private readonly getAnimationsCollectivesQueryHandler: GetAnimationsCollectivesV2QueryHandler
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
}
