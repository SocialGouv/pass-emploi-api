import { IsBoolean, IsOptional } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { transformStringToBoolean } from './utils/transformers'

export class GetSessionsJeunesQueryParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(params => transformStringToBoolean(params, 'filtrerEstInscrit'))
  filtrerEstInscrit?: boolean
}
