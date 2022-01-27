import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator'
import { Recherche } from '../../../domain/recherche'
import { FindOffresEmploiQuery } from './offres-emploi.inputs'
import { GetOffresImmersionQueryParams } from './offres-immersion.inputs'
import { isCriteresValid } from './utils/validators'

export class CreateRecherchePayload {
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
  @ValidateIf((payload: CreateRecherchePayload) => isCriteresValid(payload))
  criteres?: FindOffresEmploiQuery | GetOffresImmersionQueryParams
}
