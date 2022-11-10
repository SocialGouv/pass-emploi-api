import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested
} from 'class-validator'
import { FindOffresEmploiQueryBody } from './offres-emploi.inputs'
import { GetOffresImmersionQueryBody } from './offres-immersion.inputs'
import { Transform, Type } from 'class-transformer'
import { transformStringToBoolean } from './utils/transformers'
import { ServicesCiviqueCriteresBody } from './services-civique.inputs'

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

  @ApiProperty({ type: GetOffresImmersionQueryBody })
  @ValidateNested()
  @Type(() => GetOffresImmersionQueryBody)
  @IsDefined()
  criteres: GetOffresImmersionQueryBody
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

  @ApiProperty({ type: FindOffresEmploiQueryBody })
  @ValidateNested()
  @Type(() => FindOffresEmploiQueryBody)
  @IsDefined()
  criteres: FindOffresEmploiQueryBody
}

export class CreateRechercheServiceCiviquePayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titre: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  localisation?: string

  @ApiProperty({ type: ServicesCiviqueCriteresBody })
  @ValidateNested()
  @Type(() => ServicesCiviqueCriteresBody)
  @IsDefined()
  criteres: ServicesCiviqueCriteresBody
}

export class GetRecherchesQueryParams {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @IsIn([true, false])
  @Transform(params => transformStringToBoolean(params, 'avecGeometrie'))
  avecGeometrie?: boolean
}

class CreateSuggestionBase {
  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  idsJeunes: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  titre?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  metier?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  localisation: string
}

export class CreateSuggestionOffresEmploiPayload extends CreateSuggestionBase {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  q: string

  @ApiPropertyOptional()
  @ValidateIf(payload => !payload.departement || payload.commune?.length === 0)
  @IsString()
  @IsNotEmpty()
  commune?: string

  @ApiPropertyOptional()
  @ValidateIf(payload => !payload.commune)
  @IsString()
  @IsNotEmpty()
  departement?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  alternance?: boolean
}

export class CreateSuggestionImmersionsPayload extends CreateSuggestionBase {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  rome: string

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  lat: number

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  lon: number
}

export class CreateSuggestionServicesCiviquePayload extends CreateSuggestionBase {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  lat: number

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  lon: number
}
