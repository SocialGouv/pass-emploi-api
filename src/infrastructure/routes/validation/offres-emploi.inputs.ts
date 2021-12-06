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

  @ApiPropertyOptional({ enum: Experience })
  @IsOptional()
  @IsEnum(Experience, { each: true })
  @Transform(params => transformStringToArray(params, 'experience'))
  experience?: Experience[]

  @ApiPropertyOptional({ enum: Contrat })
  @IsOptional()
  @IsEnum(Contrat, { each: true })
  @Transform(params => transformStringToArray(params, 'contrat'))
  contrat?: Contrat[]

  @ApiPropertyOptional({ enum: Duree })
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
