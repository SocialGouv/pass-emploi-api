import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetAnimationsCollectivesQueryHandler } from 'src/application/queries/get-animations-collectives.query.handler.db'
import { AnimationCollectiveQueryModel } from 'src/application/queries/query-models/rendez-vous.query-model'
import { isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'
import { DateService } from '../../utils/date-service'
import { GetAnimationsCollectivesQueryParams } from '../../application/queries/query-models/etablissement.query-model'

@Controller('etablissements')
@ApiOAuth2([])
@ApiTags('Etablissement')
export class EtablissementsController {
  constructor(
    private readonly getAnimationsCollectivesQueryHandler: GetAnimationsCollectivesQueryHandler
  ) {}

  @ApiOperation({
    summary: "Récupère les animations collectives d'un établissement",
    description:
      "Autorisé pour un conseiller appartenant à l'établissement et ses jeuness"
  })
  @Get(':idEtablissement/animations-collectives')
  @ApiResponse({
    type: AnimationCollectiveQueryModel,
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

    if (isSuccess(result)) {
      return result.data
    }

    throw handleFailure(result)
  }
}
