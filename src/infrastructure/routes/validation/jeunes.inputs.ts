import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  MaxLength,
  Min,
  ValidateIf
} from 'class-validator'
import { Action } from '../../../domain/action/action'
import { ArchiveJeune } from '../../../domain/archive-jeune'
import { RendezVous } from '../../../domain/rendez-vous/rendez-vous'
import { transformStringToArray } from './utils/transformers'

export class UpdateConfigurationInput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  registration_token: string

  @ApiPropertyOptional()
  @IsString()
  @IsTimeZone()
  @IsOptional()
  fuseauHoraire?: string
}

export class ArchiverJeunePayload {
  @ApiProperty({ enum: ArchiveJeune.MotifSuppression })
  @IsString()
  @IsNotEmpty()
  @IsEnum(ArchiveJeune.MotifSuppression)
  motif: ArchiveJeune.MotifSuppression

  @ApiPropertyOptional()
  @ValidateIf(payload => payload.motif === ArchiveJeune.MotifSuppression.AUTRE)
  @IsNotEmpty()
  @IsString()
  @MaxLength(250)
  commentaire?: string

  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  dateFinAccompagnement?: string
}

export class TransfererConseillerPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idConseillerSource: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idConseillerCible: string

  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  idsJeune: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estTemporaire?: boolean
}

export class UpdateJeunePreferencesPayload {
  @IsOptional()
  @IsBoolean()
  partageFavoris?: boolean
  @IsOptional()
  @IsBoolean()
  alertesOffres?: boolean
  @IsOptional()
  @IsBoolean()
  messages?: boolean
  @IsOptional()
  @IsBoolean()
  creationActionConseiller?: boolean
  @IsOptional()
  @IsBoolean()
  rendezVousSessions?: boolean
  @IsOptional()
  @IsBoolean()
  rappelActions?: boolean
}

export class UpdateJeunePayload {
  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  dateSignatureCGU?: string
}

export class GetRendezVousJeuneQueryParams {
  @ApiProperty({ required: false, enum: RendezVous.Periode })
  @IsOptional()
  @IsString()
  @IsEnum(RendezVous.Periode)
  periode?: RendezVous.Periode
}

export class GetActionsByJeuneQueryParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number

  @ApiPropertyOptional({ enum: Action.Tri })
  @IsOptional()
  @IsEnum(Action.Tri)
  tri?: Action.Tri

  @ApiPropertyOptional({ enum: Action.Statut, isArray: true })
  @IsOptional()
  @IsEnum(Action.Statut, { each: true })
  @Transform(params => transformStringToArray(params, 'statuts'))
  statuts?: Action.Statut[]
}

export class GetActionsByJeuneV2QueryParams {
  @IsDateString()
  dateDebut: string

  @IsDateString()
  dateFin: string

  @IsEnum(Action.Tri)
  tri: Action.Tri

  @IsOptional()
  @IsEnum(Action.Statut, { each: true })
  @Transform(params => transformStringToArray(params, 'statuts'))
  statuts?: Action.Statut[]

  @IsOptional()
  @IsEnum(Action.Qualification.Etat, { each: true })
  @Transform(params => transformStringToArray(params, 'etats'))
  etats?: Action.Qualification.Etat[]

  @IsOptional()
  @IsEnum(Action.Qualification.Code, { each: true })
  @Transform(params => transformStringToArray(params, 'categories'))
  categories?: Action.Qualification.Code[]
}

export class MaintenantQueryParams {
  @ApiProperty()
  @IsISO8601({ strict: true })
  maintenant: string
}
