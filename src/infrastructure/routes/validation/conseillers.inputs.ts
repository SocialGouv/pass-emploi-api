import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  Length,
  ValidateNested
} from 'class-validator'
import { TriRendezVous } from 'src/application/queries/get-rendez-vous-conseiller-pagines.query.handler.db'
import { Core } from 'src/domain/core'
import { AgenceInput } from './agences.inputs'
import { transformStringToBoolean } from './utils/transformers'

export class GetConseillerQueryParams {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string
}

export class CreateJeunePoleEmploiPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idConseiller: string
}

export class CreerJeuneMiloPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idDossier: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nom: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  prenom: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idConseiller: string
}

export class EnvoyerNotificationsPayload {
  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  idsJeunes: string[]
}

class Superviseur {
  @ApiProperty()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({
    enum: Core.Structure,
    example: Object.values(Core.Structure).join(' | ')
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(Core.Structure)
  structure: Core.Structure
}

export class SuperviseursPayload {
  @ApiProperty({ type: Superviseur, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Superviseur)
  superviseurs: Superviseur[]
}

export class GetRendezVousConseillerQueryParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @IsIn([true, false])
  @Transform(params => transformStringToBoolean(params, 'presenceConseiller'))
  presenceConseiller?: boolean
}

export class GetRendezVousConseillerV2QueryParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @IsIn([true, false])
  @Transform(params => transformStringToBoolean(params, 'presenceConseiller'))
  presenceConseiller?: boolean

  @IsOptional()
  @IsEnum(TriRendezVous)
  tri?: TriRendezVous

  @IsOptional()
  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  dateDebut?: Date

  @IsOptional()
  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  dateFin?: Date
}

export class DetailConseillerPayload {
  id?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmptyObject()
  @ValidateNested({ each: true })
  @Type(() => AgenceInput)
  agence?: AgenceInput

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  notificationsSonores?: boolean
}

export class PutJeuneDuConseillerPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  idPartenaire: string
}
