import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { Recherche } from '../../../domain/recherche'
import { FindOffresEmploiQuery } from './offres-emploi.inputs'
import { GetOffresImmersionQueryParams } from './offres-immersion.inputs'

export class CreateRecherchePayload {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  idJeune: string

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  type: Recherche.Type

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  titre: string

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  metier?: string

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  localisation?: string

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  criteres: FindOffresEmploiQuery | GetOffresImmersionQueryParams
}
