import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsOptional, IsBoolean } from 'class-validator'
import { transformStringToBoolean } from './utils/transformers'

export class FindSuggestionsQueryParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(params => transformStringToBoolean(params, 'avecDiagoriente'))
  avecDiagoriente?: boolean
}
