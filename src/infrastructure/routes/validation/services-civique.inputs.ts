import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator'
import { Offre } from '../../../domain/offre/offre'
import {
  transformStringToFloat,
  transformStringToInteger
} from './utils/transformers'

export interface GetServicesCiviqueQuery {
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
  @IsOptional()
  @IsDateString()
  dateDeDebutMinimum?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateDeDebutMaximum?: string

  @ApiPropertyOptional({
    description: Object.values(Offre.ServiceCivique.Domaine).join(', ')
  })
  @IsString()
  @IsOptional()
  domaine?: string
}

export class ServicesCiviqueCriteresBody implements GetServicesCiviqueQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lat: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lon: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @IsNumber()
  distance?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateDeDebutMinimum?: string

  @ApiPropertyOptional({
    description: Object.values(Offre.ServiceCivique.Domaine).join(', ')
  })
  @IsString()
  @IsOptional()
  domaine?: string
}
