import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  GetJeunesByStructureMiloQuery,
  GetJeunesByStructureMiloQueryHandler,
  GetJeunesByStructureMiloQueryModel
} from '../../../application/queries/milo/get-jeunes-by-structure-milo.query.handler.db'
import { JeuneQueryModel } from '../../../application/queries/query-models/jeunes.query-model'
import { Authentification } from '../../../domain/authentification'
import { Utilisateur } from '../../decorators/authenticated.decorator'
import { handleFailure, handleResult } from '../result.handler'
import {
  ClotureAnimationCollectivePayload,
  GetJeunesStructureMiloQueryParams
} from './validation/structures.milo.inputs'
import { CloturerAnimationCollectiveCommandHandler } from '../../../application/commands/cloturer-animation-collective.command.handler'

@Controller('structures-milo')
@ApiOAuth2([])
@ApiTags('Structures Milo')
export class StructuresMiloController {
  constructor(
    private readonly cloturerAnimationCollectiveCommandHandler: CloturerAnimationCollectiveCommandHandler,
    private readonly getJeunesByStructureMilo: GetJeunesByStructureMiloQueryHandler
  ) {}

  @ApiOperation({
    summary: "Récupère les jeunes d'une structure Milo avec filtres optionnels",
    description:
      'Autorisé pour un conseiller Milo appartenant à la structure\n' +
      '- Si une page est demandée alors le résultat sera paginé\n' +
      '- Quand le résultat est paginé, la limite par défaut est de 10 résultats'
  })
  @Get(':idStructureMilo/jeunes')
  @ApiResponse({
    type: JeuneQueryModel,
    isArray: true
  })
  async getJeunesDeLEtablissement(
    @Param('idStructureMilo') idStructureMilo: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Query()
    getJeunesStructureMiloQueryParams: GetJeunesStructureMiloQueryParams
  ): Promise<GetJeunesByStructureMiloQueryModel> {
    const query: GetJeunesByStructureMiloQuery = {
      idStructureMilo,
      page: getJeunesStructureMiloQueryParams.page,
      limit: getJeunesStructureMiloQueryParams.limit,
      q: getJeunesStructureMiloQueryParams.q
    }
    const result = await this.getJeunesByStructureMilo.execute(
      query,
      utilisateur
    )

    return handleResult<GetJeunesByStructureMiloQueryModel>(result)
  }

  @ApiOperation({
    summary: 'Clot une animation collective et inscrit les jeunes',
    description:
      "Autorisé pour un conseiller appartenant à la structure MILO de l'animation collective"
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
}
