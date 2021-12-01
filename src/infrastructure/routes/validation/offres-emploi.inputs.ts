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

enum Experience {
  exp1 = '1',
  exp2 = '2',
  exp3 = '3'
}

enum Contrat {
  c1 = 'CDI',
  c2 = 'CDD',
  c3 = 'interim',
  c4 = 'saisonnier',
  c5 = 'autre'
}

enum Duree {
  d1 = '0',
  d2 = '1',
  d3 = '2'
}
export class FindOffresEmploiQuery {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(Experience, { each: true })
  @Transform(params => transformStringToArray(params, 'experience'))
  experience?: Experience[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(Contrat, { each: true })
  @Transform(params => transformStringToArray(params, 'contrat'))
  contrat?: Contrat[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(Duree, { each: true })
  @Transform(params => transformStringToArray(params, 'duree'))
  duree?: Duree[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(params => transformStringToInteger(params, 'rayon'))
  rayon?: number
}
