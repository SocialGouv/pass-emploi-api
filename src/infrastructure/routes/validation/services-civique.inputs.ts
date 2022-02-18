import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator'
import {
  transformStringToFloat,
  transformStringToInteger
} from './utils/transformers'
import { OffreEngagement } from '../../../domain/offre-engagement'

interface GetServicesCiviqueQuery {
  page?: number
  limit?: number
  lat?: number
  lon?: number
  distance?: number
  dateDeDebutMinimum?: string
  dateDeDebutMaximum?: string
  domaine?: string
}

export class GetServicesCiviqueQueryParams implements GetServicesCiviqueQuery {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Transform(params => transformStringToInteger(params, 'page'))
  page?: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @IsNumber()
  @Transform(params => transformStringToInteger(params, 'limit'))
  limit?: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @IsNumber()
  @Transform(params => transformStringToFloat(params, 'lat'))
  lat: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @IsNumber()
  @Transform(params => transformStringToFloat(params, 'lon'))
  lon: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @IsNumber()
  @Transform(params => transformStringToInteger(params, 'distance'))
  distance?: number

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateDeDebutMinimum?: string

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateDeDebutMaximum: string

  @ApiPropertyOptional({
    description: Object.values(OffreEngagement.Domaine).join(', ')
  })
  @IsString()
  @IsOptional()
  domaine: string
}
