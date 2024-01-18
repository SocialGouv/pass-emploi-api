import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MinLength,
  ValidateNested
} from 'class-validator'
import { TriActionsConseillerV2 } from 'src/application/queries/action/get-actions-conseiller-v2.query.handler.db'
import { TriRendezVous } from 'src/application/queries/rendez-vous/get-rendez-vous-conseiller-pagines.query.handler.db'
import { Action } from 'src/domain/action/action'
import { Core } from 'src/domain/core'
import { AgenceInput } from 'src/infrastructure/routes/validation/agences.inputs'
import {
  transformStringToArray,
  transformStringToBoolean
} from './utils/transformers'

export class GetConseillersQueryParams {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  q: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(Core.structuresPoleEmploiBRSA)
  structure?: string
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
  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmptyObject()
  @ValidateNested({ each: true })
  @Type(() => AgenceInput)
  agence?: AgenceInput

  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  dateSignatureCGU?: string

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

export class GetIndicateursPourConseillerQueryParams {
  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  dateDebut: Date

  @ApiProperty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  dateFin: Date

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @IsIn([true, false])
  @Transform(params =>
    transformStringToBoolean(params, 'exclureOffresEtFavoris')
  )
  exclureOffresEtFavoris?: boolean
}

export class CreateListeDeDiffusionPayload {
  @ApiProperty()
  @IsString()
  titre: string

  @ApiProperty()
  @IsArray()
  idsBeneficiaires: string[]
}

export class UpdateListeDeDiffusionPayload {
  @ApiProperty()
  @IsString()
  titre: string

  @ApiProperty()
  @IsArray()
  idsBeneficiaires: string[]
}

export class GetActionsConseillerV2QueryParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsEnum(Action.Qualification.Code, { each: true })
  @Transform(params => transformStringToArray(params, 'codesCategories'))
  codesCategories?: Action.Qualification.Code[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @IsIn([true, false])
  @Transform(params => transformStringToBoolean(params, 'aQualifier'))
  aQualifier?: boolean

  @IsOptional()
  @IsString()
  @IsEnum(TriActionsConseillerV2)
  tri?: TriActionsConseillerV2
}

export class GetIdentitesJeunesQueryParams {
  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  @Transform(params => transformStringToArray(params, 'ids'))
  ids: string[]
}
