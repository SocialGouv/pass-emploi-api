import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetAnimationsCollectivesQueryHandler } from 'src/application/queries/get-animations-collectives.query.handler.db'
import { AnimationCollectiveQueryModel } from 'src/application/queries/query-models/rendez-vous.query-model'
import { GetJeunesByEtablissementQueryHandler } from '../../application/queries/get-jeunes-by-etablissement.query.handler.db'
import { JeuneQueryModel } from '../../application/queries/query-models/jeunes.query-model'
import { isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { DateService } from '../../utils/date-service'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'
import { GetAnimationsCollectivesQueryParams } from './validation/etablissements.inputs'

@Controller('etablissements')
@ApiOAuth2([])
@ApiTags('Etablissements')
export class EtablissementsController {
  constructor(
    private readonly getAnimationsCollectivesQueryHandler: GetAnimationsCollectivesQueryHandler,
    private readonly getJeunesEtablissementQueryHandler: GetJeunesByEtablissementQueryHandler
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

  @ApiOperation({
    summary: "Récupère les jeunes d'un établissement",
    description: "Autorisé pour un conseiller appartenant à l'établissement"
  })
  @Get(':idEtablissement/jeunes')
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

    if (isSuccess(result)) {
      return result.data
    }

    throw handleFailure(result)
  }
}
