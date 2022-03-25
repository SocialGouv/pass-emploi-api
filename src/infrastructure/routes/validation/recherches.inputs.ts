import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
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
