import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CloturerAnimationCollectiveCommandHandler } from '../../application/commands/cloturer-animation-collective.command.handler'
import { GetAnimationsCollectivesQueryHandler } from '../../application/queries/rendez-vous/get-animations-collectives.query.handler.db'
import { GetConseillersEtablissementQueryHandler } from 'src/application/queries/get-conseillers-etablissement.query.handler.db'
import { GetJeunesByEtablissementQueryHandler } from '../../application/queries/get-jeunes-by-etablissement.query.handler.db'
import { JeuneQueryModel } from '../../application/queries/query-models/jeunes.query-model'
import { DetailConseillerQueryModel } from 'src/application/queries/query-models/conseillers.query-model'
import {
  AnimationCollectiveQueryModel,
  RendezVousConseillerDetailQueryModel
} from '../../application/queries/query-models/rendez-vous.query-model'
import { isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { DateService } from '../../utils/date-service'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'
import {
  ClotureAnimationCollectivePayload,
  GetAnimationsCollectivesQueryParams
} from './validation/etablissements.inputs'

@Controller('etablissements')
@ApiOAuth2([])
@ApiTags('Etablissements')
export class EtablissementsController {
  constructor(
    private readonly cloturerAnimationCollectiveCommandHandler: CloturerAnimationCollectiveCommandHandler,
    private readonly getAnimationsCollectivesQueryHandler: GetAnimationsCollectivesQueryHandler,
    private readonly getConseillersEtablissementQueryHandler: GetConseillersEtablissementQueryHandler,
    private readonly getJeunesEtablissementQueryHandler: GetJeunesByEtablissementQueryHandler
  ) {}

  @ApiOperation({
    summary: "Récupère les animations collectives d'un établissement",
    description:
      "Autorisé pour un conseiller appartenant à l'établissement et ses jeunes"
  })
  @Get(':idEtablissement/animations-collectives')
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

    if (isSuccess(result)) {
      return result.data
    }

    throw handleFailure(result)
  }

  @ApiOperation({
    summary: 'Clot une animation collective et inscrit les jeunes',
    description:
      "Autorisé pour un conseiller appartenant à l'établissement de l'animation collective"
  })
  @Post('animations-collectives/:idAnimationCollective/cloturer')
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

    handleFailure(result)
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

  @ApiOperation({
    summary: 'Récupère une liste de conseillers par agence',
    description: 'Autorisé pour un conseiller superviseur'
  })
  @Get(':idEtablissement/conseillers')
  @ApiResponse({
    type: DetailConseillerQueryModel,
    isArray: true
  })
  async getConseillersEtablissement(
    @Param('idEtablissement') idAgence: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DetailConseillerQueryModel[]> {
    const result = await this.getConseillersEtablissementQueryHandler.execute(
      { idAgence },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }

    throw handleFailure(result)
  }
}
