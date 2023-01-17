import { Controller, Get } from '@nestjs/common'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetMotifsSuppressionJeuneQueryHandler } from '../../../application/queries/get-motifs-suppression-jeune.query.handler'
import { MotifSuppressionJeuneQueryModel } from '../../../application/queries/query-models/jeunes.query-model'
import { isSuccess } from '../../../building-blocks/types/result'
import { handleFailure } from '../failure.handler'

@Controller('v2/referentiels')
@ApiTags('Referentiels')
export class ReferentielsControllerV2 {
  constructor(
    private readonly getMotifsSuppressionJeuneQueryHandler: GetMotifsSuppressionJeuneQueryHandler
  ) {}

  @Get('motifs-suppression-jeune')
  @ApiOAuth2([])
  @ApiResponse({
    type: MotifSuppressionJeuneQueryModel,
    isArray: true
  })
  async getMotifsSuppressionJeune(): Promise<
    MotifSuppressionJeuneQueryModel[]
  > {
    const result = await this.getMotifsSuppressionJeuneQueryHandler.execute({})
    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }
}
