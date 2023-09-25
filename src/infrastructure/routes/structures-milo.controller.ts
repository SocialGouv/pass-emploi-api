import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  GetJeunesByStructureMiloQueryHandler,
  GetJeunesByStructureMiloQueryModel
} from '../../application/queries/milo/get-jeunes-by-structure-milo.query.handler.db'
import { JeuneQueryModel } from '../../application/queries/query-models/jeunes.query-model'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleResult } from './result.handler'
import { GetJeunesStructureMiloQueryParams } from './validation/structures-milo.inputs'

@Controller('structures-milo')
@ApiOAuth2([])
@ApiTags('Structures Milo')
export class StructuresMiloController {
  constructor(
    private readonly getJeunesByStructureMilo: GetJeunesByStructureMiloQueryHandler
  ) {}

  @ApiOperation({
    summary: "Récupère les jeunes d'une structure Milo avec filtres optionnels",
    description: 'Autorisé pour un conseiller Milo appartenant à la structure'
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
    const result = await this.getJeunesByStructureMilo.execute(
      {
        idStructureMilo,
        page: getJeunesStructureMiloQueryParams.page,
        limit: getJeunesStructureMiloQueryParams.limit,
        q: getJeunesStructureMiloQueryParams.q
      },
      utilisateur
    )

    return handleResult<GetJeunesByStructureMiloQueryModel>(result)
  }
}
