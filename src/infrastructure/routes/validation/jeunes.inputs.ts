import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  MaxLength,
  ValidateIf
} from 'class-validator'
import { ArchiveJeune } from '../../../domain/archive-jeune'
import { RendezVous } from '../../../domain/rendez-vous/rendez-vous'

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
  @IsOptional()
  @IsString()
  @IsEnum(RendezVous.Periode)
  periode?: RendezVous.Periode
}

export class GetRendezVousJeuneConseillerQueryParams {
  @IsDateString()
  dateDebut: string

  @IsDateString()
  dateFin: string
}

export class GetActionsByJeuneQueryParams {
  @IsDateString()
  dateDebut: string

  @IsDateString()
  dateFin: string
}

export class MaintenantQueryParams {
  @ApiProperty()
  @IsISO8601({ strict: true })
  maintenant: string
}
