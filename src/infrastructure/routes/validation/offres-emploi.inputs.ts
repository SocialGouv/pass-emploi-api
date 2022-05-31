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
import { Contrat, Duree, Experience } from 'src/domain/offre-emploi'
import {
  transformStringToInteger,
  transformStringToBoolean,
  transformStringToArray
} from './utils/transformers'

interface FindOffresEmploisQuery {
  q?: string
  departement?: string
  alternance?: boolean
  experience?: Experience[]
  debutantAccepte?: boolean
  contrat?: Contrat[]
  duree?: Duree[]
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
  @IsBoolean()
  @IsOptional()
  @IsIn([true, false])
  @Transform(params => transformStringToBoolean(params, 'alternance'))
  alternance?: boolean

  @ApiPropertyOptional({ enum: Experience, isArray: true })
  @IsOptional()
  @IsEnum(Experience, { each: true })
  @Transform(params => transformStringToArray(params, 'experience'))
  experience?: Experience[]

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @IsIn([true, false])
  @Transform(params => transformStringToBoolean(params, 'debutantAccepte'))
  debutantAccepte?: boolean

  @ApiPropertyOptional({ enum: Contrat, isArray: true })
  @IsOptional()
  @IsEnum(Contrat, { each: true })
  @Transform(params => transformStringToArray(params, 'contrat'))
  contrat?: Contrat[]

  @ApiPropertyOptional({ enum: Duree, isArray: true })
  @IsOptional()
  @IsEnum(Duree, { each: true })
  @Transform(params => transformStringToArray(params, 'duree'))
  duree?: Duree[]

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
  @IsBoolean()
  @IsOptional()
  @IsIn([true, false])
  alternance?: boolean

  @ApiPropertyOptional({ enum: Experience, isArray: true })
  @IsOptional()
  @IsEnum(Experience, { each: true })
  experience?: Experience[]

  @ApiPropertyOptional({ enum: Contrat, isArray: true })
  @IsOptional()
  @IsEnum(Contrat, { each: true })
  contrat?: Contrat[]

  @ApiPropertyOptional({ enum: Duree, isArray: true })
  @IsOptional()
  @IsEnum(Duree, { each: true })
  duree?: Duree[]

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
