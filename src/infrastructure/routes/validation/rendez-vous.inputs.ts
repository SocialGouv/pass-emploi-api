import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  Equals,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf
} from 'class-validator'
import { CodeTypeRendezVous } from 'src/domain/rendez-vous'

export class CreateRendezVousPayload {
  @ApiProperty()
  @IsString()
  comment: string

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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  jeuneId: string

  @ApiPropertyOptional({ enum: CodeTypeRendezVous })
  @IsOptional()
  @IsString()
  @IsEnum(CodeTypeRendezVous)
  type?: string

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
  invitation?: boolean
}
