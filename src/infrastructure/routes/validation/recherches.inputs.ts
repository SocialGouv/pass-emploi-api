import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator'
import { FindOffresEmploiQuery } from './offres-emploi.inputs'
import { GetOffresImmersionQueryParams } from './offres-immersion.inputs'
import { Type } from 'class-transformer'

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

  @ApiPropertyOptional({ type: GetOffresImmersionQueryParams })
  @ValidateNested({ each: true })
  @Type(() => GetOffresImmersionQueryParams)
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

  @ApiPropertyOptional({ type: FindOffresEmploiQuery })
  @ValidateNested({ each: true })
  @Type(() => FindOffresEmploiQuery)
  criteres?: FindOffresEmploiQuery
}
