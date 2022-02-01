import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator'
import {
  transformStringToFloat,
  transformStringToInteger
} from './utils/transformers'

interface GetOffresImmersionQuery {
  rome: string
  lat: number
  lon: number
  distance?: number
}

export class GetOffresImmersionQueryParams implements GetOffresImmersionQuery {
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

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Transform(params => transformStringToInteger(params, 'distance'))
  distance?: number
}

export class GetOffresImmersionQueryBody {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  rome: string

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  lat: number

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  lon: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  distance?: number
}
