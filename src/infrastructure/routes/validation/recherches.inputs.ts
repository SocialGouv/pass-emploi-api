import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator'
import { FindOffresEmploiQueryBody } from './offres-emploi.inputs'
import { GetOffresImmersionQueryBody } from './offres-immersion.inputs'
import { Transform, Type } from 'class-transformer'
import {
  transformStringToBoolean,
  transformStringToFloat,
  transformStringToInteger
} from './utils/transformers'

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
  domaine?: string

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Transform(params => transformStringToFloat(params, 'lat'))
  lat?: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Transform(params => transformStringToFloat(params, 'lon'))
  lon?: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Transform(params => transformStringToInteger(params, 'distance'))
  distance?: number

  @ApiPropertyOptional({
    example: '2022-02-15T10:12:14.000Z'
  })
  @IsDateString()
  @IsOptional()
  dateDeDebutMinimum?: string

  @ApiPropertyOptional({
    example: '2022-02-15T10:12:14.000Z'
  })
  @IsDateString()
  @IsOptional()
  dateDeDebutMaximum?: string
}

export class GetRecherchesQueryParams {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @IsIn([true, false])
  @Transform(params => transformStringToBoolean(params, 'avecGeometrie'))
  avecGeometrie?: boolean
}
