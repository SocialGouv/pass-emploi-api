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
  precision?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  adresse?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
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
}

export class UpdateRendezVousPayload {
  @ApiProperty()
  @IsArray()
  jeunesIds: string[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
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
  modality?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adresse?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organisme?: string

  @ApiProperty()
  @IsBoolean()
  @IsIn([true, false])
  presenceConseiller: boolean
}
