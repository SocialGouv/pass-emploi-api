import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query
} from '@nestjs/common'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  GetActionsByJeuneQuery,
  GetActionsByJeuneQueryHandler
} from '../../../application/queries/get-actions-by-jeune.query.handler.db'
import { ListeActionsV2QueryModel } from '../../../application/queries/query-models/actions.query-model'
import { isSuccess } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { Utilisateur } from '../../decorators/authenticated.decorator'
import { handleFailure } from '../failure.handler'
import { GetActionsByJeuneV2QueryParams } from '../validation/jeunes.inputs'

@Controller('v2/jeunes')
@ApiOAuth2([])
@ApiTags('Jeunes')
export class JeunesControllerV2 {
  constructor(
    private readonly getActionsByJeuneQueryHandler: GetActionsByJeuneQueryHandler
  ) {}

  @Get(':idJeune/actions')
  @ApiResponse({
    type: ListeActionsV2QueryModel
  })
  @HttpCode(HttpStatus.PARTIAL_CONTENT)
  async getActions(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Query() getActionsByJeuneQueryParams: GetActionsByJeuneV2QueryParams
  ): Promise<ListeActionsV2QueryModel> {
    const query: GetActionsByJeuneQuery = {
      idJeune,
      page: getActionsByJeuneQueryParams.page,
      tri: getActionsByJeuneQueryParams.tri,
      statuts: getActionsByJeuneQueryParams.statuts
    }

    const result = await this.getActionsByJeuneQueryHandler.execute(
      query,
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }

    throw handleFailure(result)
  }
}
