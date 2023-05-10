import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsIn,
  IsBoolean,
  IsNumber
} from 'class-validator'
import {
  transformStringToInteger,
  transformStringToBoolean,
  transformStringToArray
} from './utils/transformers'
import { Offre } from '../../../domain/offre/offre'

interface FindOffresEmploisQuery {
  q?: string
  departement?: string
  alternance?: string
  experience?: Offre.Emploi.Experience[]
  debutantAccepte?: boolean
  contrat?: Offre.Emploi.Contrat[]
  duree?: Offre.Emploi.Duree[]
  commune?: string
  rayon?: number
}

export class FindOffresEmploiQueryParams implements FindOffresEmploisQuery {
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
  q?: string

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  departement?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsIn(['true', 'false'])
  alternance?: string

  @ApiPropertyOptional({ enum: Offre.Emploi.Experience, isArray: true })
  @IsOptional()
  @IsEnum(Offre.Emploi.Experience, { each: true })
  @Transform(params => transformStringToArray(params, 'experience'))
  experience?: Offre.Emploi.Experience[]

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @IsIn([true, false])
  @Transform(params => transformStringToBoolean(params, 'debutantAccepte'))
  debutantAccepte?: boolean

  @ApiPropertyOptional({ enum: Offre.Emploi.Contrat, isArray: true })
  @IsOptional()
  @IsEnum(Offre.Emploi.Contrat, { each: true })
  @Transform(params => transformStringToArray(params, 'contrat'))
  contrat?: Offre.Emploi.Contrat[]

  @ApiPropertyOptional({ enum: Offre.Emploi.Duree, isArray: true })
  @IsOptional()
  @IsEnum(Offre.Emploi.Duree, { each: true })
  @Transform(params => transformStringToArray(params, 'duree'))
  duree?: Offre.Emploi.Duree[]

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  commune?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(params => transformStringToInteger(params, 'rayon'))
  rayon?: number
}

export class FindOffresEmploiQueryBody implements FindOffresEmploisQuery {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  q?: string

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  departement?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsIn(['true', 'false'])
  alternance?: string

  @ApiPropertyOptional({ enum: Offre.Emploi.Experience, isArray: true })
  @IsOptional()
  @IsEnum(Offre.Emploi.Experience, { each: true })
  experience?: Offre.Emploi.Experience[]

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @IsIn([true, false])
  debutantAccepte?: boolean

  @ApiPropertyOptional({ enum: Offre.Emploi.Contrat, isArray: true })
  @IsOptional()
  @IsEnum(Offre.Emploi.Contrat, { each: true })
  contrat?: Offre.Emploi.Contrat[]

  @ApiPropertyOptional({ enum: Offre.Emploi.Duree, isArray: true })
  @IsOptional()
  @IsEnum(Offre.Emploi.Duree, { each: true })
  duree?: Offre.Emploi.Duree[]

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  commune?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rayon?: number
}
