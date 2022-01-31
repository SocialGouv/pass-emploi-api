import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { FindOffresEmploiQuery } from './offres-emploi.inputs'
import { GetOffresImmersionQueryParams } from './offres-immersion.inputs'

export class CreateRechercheImmersionPayload {
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
  criteres: GetOffresImmersionQueryParams
}

export class CreateRechercheOffresEmploiPayload {
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
  criteres?: FindOffresEmploiQuery
}

export class CreateRechercheAlternancePayload {
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
  criteres?: FindOffresEmploiQuery
}
