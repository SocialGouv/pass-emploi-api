import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsArray,
  IsEnum,
  ValidateIf,
  MaxLength,
  IsEmail
} from 'class-validator'
import {
  transformStringToFloat,
  transformStringToInteger
} from './utils/transformers'

interface GetOffresImmersionQuery {
  rome: string
  lat: number
  lon: number
  distance?: number
}

export class GetOffresImmersionQueryParams implements GetOffresImmersionQuery {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  rome: string

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform(params => transformStringToFloat(params, 'lat'))
  lat: number

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform(params => transformStringToFloat(params, 'lon'))
  lon: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Transform(params => transformStringToInteger(params, 'distance'))
  distance?: number
}

export class GetOffresImmersionQueryBody {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  distance?: number
}

class Location {
  @ApiProperty()
  @IsNumber()
  lat: number

  @ApiProperty()
  @IsNumber()
  lon: number
}

class NouvelleOffreImmersion {
  @ApiPropertyOptional({ type: Location })
  @ValidateNested()
  @IsOptional()
  @Type(() => Location)
  location?: Location

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  rome: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  siret: string
}

export class NouvellesOffresImmersions {
  @ApiProperty({ type: NouvelleOffreImmersion, isArray: true })
  @ValidateNested()
  @Type(() => NouvelleOffreImmersion)
  @IsArray()
  immersions: NouvelleOffreImmersion[]
}

enum ModeContact {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  IN_PERSON = 'IN_PERSON'
}

export class PostImmersionContactBody {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  codeRome: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  labelRome: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  siret: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  prenom: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nom: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string

  @ApiProperty({ enum: ModeContact })
  @IsString()
  @IsNotEmpty()
  @IsEnum(ModeContact)
  contactMode: ModeContact

  @ApiPropertyOptional()
  @ValidateIf(payload => payload.contactMode === ModeContact.EMAIL)
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  message?: string
}
