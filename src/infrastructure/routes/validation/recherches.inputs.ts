import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { Recherche } from '../../../domain/recherche'
import { FindOffresEmploiQuery } from './offres-emploi.inputs'
import { GetOffresImmersionQueryParams } from './offres-immersion.inputs'
import { isCriteresValid } from './utils/validators'

export class CreateRecherchePayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: Recherche.Type

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titre: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  metier?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  localisation?: string

  @ApiPropertyOptional()
  @isCriteresValid('type')
  criteres?: FindOffresEmploiQuery | GetOffresImmersionQueryParams
}
