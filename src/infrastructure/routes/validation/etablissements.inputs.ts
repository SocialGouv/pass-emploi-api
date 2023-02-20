import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsIn,
  IsString
} from 'class-validator'
import { transformStringToBoolean } from './utils/transformers'

export class GetAnimationsCollectivesQueryParams {
  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  dateDebut?: string

  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  dateFin?: string
}

export class GetAnimationsCollectivesV2QueryParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @IsIn([true, false])
  @Transform(params => transformStringToBoolean(params, 'aClore'))
  aClore?: boolean
}

export class GetJeunesEtablissementV2QueryParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number

  @ApiProperty({ required: true })
  @IsString()
  q: string
}

export class ClotureAnimationCollectivePayload {
  @ApiProperty()
  @IsArray()
  idsJeunes: string[]
}
