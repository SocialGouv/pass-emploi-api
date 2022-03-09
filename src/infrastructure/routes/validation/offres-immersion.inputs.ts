import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsEnum,
  IsArray,
  IsBoolean
} from 'class-validator'
import { OffresImmersion } from '../../../domain/offre-immersion'
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

class ContactDetails {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  id: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  lastName: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  firstName: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  role: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string
}

class Location {
  @ApiProperty()
  @IsNumber()
  lat: number

  @ApiProperty()
  @IsNumber()
  lon: number
}

class NouvelleOffreImmersion implements OffresImmersion.Partenaire.Dto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  address: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  city: string

  @ApiPropertyOptional({ type: ContactDetails })
  @ValidateNested()
  @Type(() => ContactDetails)
  contactDetails: ContactDetails | undefined

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactId: string

  @ApiPropertyOptional({ enum: OffresImmersion.Partenaire.ContactMode })
  @IsString()
  @IsOptional()
  @IsEnum(OffresImmersion.Partenaire.ContactMode)
  contactMode?: OffresImmersion.Partenaire.ContactMode

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  distance_m?: number

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  id: string

  @ApiPropertyOptional({ type: Location })
  @ValidateNested()
  @IsOptional()
  @Type(() => Location)
  location?: Location

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  naf: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  nafLabel: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  rome: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  romeLabel: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  siret: string

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  @IsNotEmpty()
  voluntaryToImmersion: boolean
}

export class NouvellesOffresImmersions {
  @ApiProperty({ type: NouvelleOffreImmersion, isArray: true })
  @ValidateNested()
  @Type(() => NouvelleOffreImmersion)
  @IsArray()
  immersions: NouvelleOffreImmersion[]
}
