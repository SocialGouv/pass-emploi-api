import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString
} from 'class-validator'
import { transformStringToInteger } from './utils/transformers'

export class FindEvenementsEmploiQueryParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Transform(params => transformStringToInteger(params, 'page'))
  page?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Transform(params => transformStringToInteger(params, 'limit'))
  limit?: number

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Transform(params => transformStringToInteger(params, 'codePostal'))
  codePostal: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @IsIn(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'])
  secteurActivite?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @IsDateString()
  dateDebut?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @IsDateString()
  dateFin?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Transform(params => transformStringToInteger(params, 'typeEvenement'))
  @IsIn([13, 14, 15, 16, 17, 18, 31, 32])
  typeEvenement?: number

  @ApiPropertyOptional({ description: 'values = [1: ADIST, 2: ENPHY]' })
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Transform(params => transformStringToInteger(params, 'modalite'))
  @IsIn([1, 2])
  modalite?: number
}
