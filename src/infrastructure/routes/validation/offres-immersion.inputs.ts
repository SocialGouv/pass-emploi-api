import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsNotEmpty, IsString, IsNumber } from 'class-validator'
import { transformStringToFloat } from './utils/transformers'

export class FindOffresImmersionQuery {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  rome: string

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform(params => transformStringToFloat(params, 'lat'))
  lat: number

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform(params => transformStringToFloat(params, 'lon'))
  lon: number
}
