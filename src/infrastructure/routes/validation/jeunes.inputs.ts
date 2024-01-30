import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  Min,
  ValidateIf
} from 'class-validator'
import { RendezVous } from '../../../domain/rendez-vous/rendez-vous'
import { Action } from '../../../domain/action/action'
import { Transform, Type } from 'class-transformer'
import { transformStringToArray } from './utils/transformers'
import { ArchiveJeune } from '../../../domain/archive-jeune'

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
  commentaire?: string
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
  @IsBoolean()
  partageFavoris: boolean
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
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page: number

  @IsEnum(Action.Tri)
  tri: Action.Tri

  @ApiPropertyOptional({ enum: Action.Statut, isArray: true })
  @IsOptional()
  @IsEnum(Action.Statut, { each: true })
  @Transform(params => transformStringToArray(params, 'statuts'))
  statuts?: Action.Statut[]

  @ApiPropertyOptional({ enum: Action.Qualification.Etat, isArray: true })
  @IsOptional()
  @IsEnum(Action.Qualification.Etat, { each: true })
  @Transform(params => transformStringToArray(params, 'etats'))
  etats?: Action.Qualification.Etat[]

  @ApiPropertyOptional({ enum: Action.Qualification.Code, isArray: true })
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
