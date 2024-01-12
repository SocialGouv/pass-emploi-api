import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested
} from 'class-validator'
import { Action } from '../../../domain/action/action'
import { SessionMilo } from '../../../domain/milo/session.milo'
import { transformStringToBoolean } from './utils/transformers'
import Inscription = SessionMilo.Inscription

export class GetSessionsQueryParams {
  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  dateDebut?: string

  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  dateFin?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(params => transformStringToBoolean(params, 'filtrerAClore'))
  filtrerAClore?: boolean
}

export class GetSessionsV2QueryParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @IsIn([true, false])
  @Transform(params => transformStringToBoolean(params, 'filtrerAClore'))
  filtrerAClore?: boolean
}

export class GetAgendaSessionsQueryParams {
  @IsNotEmpty()
  @IsDateString()
  dateDebut: string

  @IsNotEmpty()
  @IsDateString()
  dateFin: string
}

class InscriptionSessionMiloPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idJeune: string

  @ApiProperty()
  @IsEnum(SessionMilo.Modification.StatutInscription)
  statut: SessionMilo.Modification.StatutInscription

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  commentaire?: string
}

export class UpdateSessionMiloPayload {
  @ApiProperty()
  @ValidateIf(
    payload =>
      payload.inscriptions === undefined || payload.estVisible !== undefined
  )
  @IsDefined({ message: 'Au moins un des champs doit être renseigné' })
  @IsBoolean()
  estVisible?: boolean

  @ApiProperty()
  @ValidateIf(
    payload =>
      payload.estVisible === undefined || payload.inscriptions !== undefined
  )
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InscriptionSessionMiloPayload)
  inscriptions?: InscriptionSessionMiloPayload[]
}

export class EmargementJeuneSessionMiloPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idJeune: string

  @ApiProperty()
  @IsEnum(Inscription.Statut)
  statut: Inscription.Statut
}

export class EmargementsSessionMiloPayload {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  @Type(() => EmargementJeuneSessionMiloPayload)
  emargements: EmargementJeuneSessionMiloPayload[]
}

class QualificationActionMiloPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idAction: string

  @ApiProperty({ enum: Action.Qualification.Code })
  @IsString()
  @IsEnum(Action.Qualification.Code)
  codeQualification: Action.Qualification.Code

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  commentaireQualification?: string

  @ApiPropertyOptional({ type: 'string', format: 'date-time' })
  @IsDateString()
  @IsOptional()
  dateDebut?: string

  @ApiPropertyOptional({ type: 'string', format: 'date-time' })
  @IsDateString()
  @IsOptional()
  dateFinReelle?: string
}

export class QualifierActionsMiloPayload {
  @ApiProperty()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => QualificationActionMiloPayload)
  qualifications: QualificationActionMiloPayload[]
}
