import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { transformStringToInteger } from './utils/transformers'

export class FindEvenementsEmploiQueryParams {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  codePostal: string

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsOptional()
  @IsNumber()
  @Transform(params => transformStringToInteger(params, 'page'))
  page?: number

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsOptional()
  @IsNumber()
  @Transform(params => transformStringToInteger(params, 'limit'))
  limit?: number

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  secteurActivite?: string

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  dateDebut?: string

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  dateFin?: string

  @ApiPropertyOptional()
  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  @Transform(params => transformStringToInteger(params, 'typeEvenement'))
  typeEvenement?: number

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsOptional()
  modalite?: string
}
