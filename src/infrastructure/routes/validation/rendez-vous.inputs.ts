import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ArrayNotEmpty,
  Equals,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf
} from 'class-validator'
import {
  CodeTypeRendezVous,
  RendezVous
} from '../../../domain/rendez-vous/rendez-vous'

export class CreateRendezVousPayload {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(1024)
  comment?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  date: string

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  duration: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  modality?: string

  @ApiPropertyOptional({ enum: CodeTypeRendezVous })
  @IsOptional()
  @IsString()
  @IsEnum(CodeTypeRendezVous)
  type?: string

  @ApiProperty()
  @IsArray()
  @ValidateIf(payload => !RendezVous.estUnTypeAnimationCollective(payload.type))
  @ArrayNotEmpty()
  jeunesIds: string[]

  @ApiPropertyOptional()
  @ValidateIf(
    payload =>
      payload.titre !== undefined ||
      RendezVous.estUnTypeAnimationCollective(payload.type)
  )
  @IsString()
  @IsNotEmpty()
  titre?: string

  @ApiPropertyOptional()
  @ValidateIf(payload => payload.type === CodeTypeRendezVous.AUTRE)
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  precision?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(250)
  adresse?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  organisme?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @IsIn([true, false])
  @ValidateIf(
    payload =>
      payload.type === undefined ||
      payload.type === CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
  )
  @Equals(true)
  presenceConseiller?: boolean

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @IsIn([true, false])
  invitation?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  nombreMaxParticipants?: number
}

export class UpdateRendezVousPayload {
  @ApiProperty()
  @IsArray()
  jeunesIds: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titre?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  comment?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  date: string

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  duration: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  modality?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(250)
  adresse?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(250)
  organisme?: string

  @ApiProperty()
  @IsBoolean()
  @IsIn([true, false])
  presenceConseiller: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  nombreMaxParticipants?: number
}

export class CloreRendezVousPayload {
  @IsBoolean()
  present: boolean
}
