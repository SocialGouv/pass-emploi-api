import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  IsOptional,
  IsBoolean,
  IsNumber,
  IsNotEmpty,
  ValidateNested,
  IsString
} from 'class-validator'
import { transformStringToBoolean } from './utils/transformers'
import { Suggestion } from 'src/domain/offre/recherche/suggestion/suggestion'

export class FindSuggestionsQueryParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(params => transformStringToBoolean(params, 'avecDiagoriente'))
  avecDiagoriente?: boolean
}

export class DiagorienteLocation {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  libelle: string

  @ApiProperty()
  @IsNotEmpty()
  type: Suggestion.TypeLocalisation

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  code: string

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  latitude?: number

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  longitude?: number
}

export class DiagorienteInformationsPayload {
  @ApiProperty({ type: DiagorienteLocation })
  @ValidateNested()
  @Type(() => DiagorienteLocation)
  location: DiagorienteLocation

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  rayon?: number
}
