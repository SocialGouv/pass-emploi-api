import { Controller, Get } from '@nestjs/common'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import { MotifSuppressionV2QueryModel } from '../../../application/queries/query-models/jeunes.query-model'
import { GetMotifsSuppressionJeuneV2QueryHandler } from '../../../application/queries/v2/get-motifs-suppression-jeune-v2.query.handler'
import { isSuccess } from '../../../building-blocks/types/result'
import { handleFailure } from '../failure.handler'

@Controller('v2/referentiels')
@ApiTags('Referentiels')
export class ReferentielsControllerV2 {
  constructor(
    private readonly getMotifsSuppressionJeuneV2QueryHandler: GetMotifsSuppressionJeuneV2QueryHandler
  ) {}

  @Get('motifs-suppression-jeune')
  @ApiOAuth2([])
  @ApiResponse({
    type: MotifSuppressionV2QueryModel,
    isArray: true
  })
  async getMotifsSuppressionJeune(): Promise<MotifSuppressionV2QueryModel[]> {
    const result = await this.getMotifsSuppressionJeuneV2QueryHandler.execute(
      {}
    )
    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }
}
