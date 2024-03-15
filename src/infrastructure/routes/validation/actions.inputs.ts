import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNotIn,
  IsOptional,
  IsString,
  MaxLength
} from 'class-validator'
import { Action } from '../../../domain/action/action'

export class UpdateStatutActionPayload {
  @ApiProperty({ enum: Action.Statut })
  @IsString()
  @IsEnum(Action.Statut)
  status: Action.Statut
}

export class UpdateActionPayload {
  @ApiPropertyOptional({ enum: Action.Statut })
  @IsOptional()
  @IsString()
  @IsEnum(Action.Statut)
  @IsNotEmpty()
  status?: Action.Statut

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  contenu?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string

  @ApiPropertyOptional({ type: 'string', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  dateEcheance?: string

  @ApiPropertyOptional({ type: 'string', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  dateFinReelle?: string

  @ApiPropertyOptional({ enum: Action.Qualification.Code })
  @IsOptional()
  @IsEnum(Action.Qualification.Code)
  @IsNotEmpty()
  codeQualification?: Action.Qualification.Code
}

export class AddCommentaireActionPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  commentaire: string
}

export class QualifierActionPayload {
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

export class CreateActionPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  comment?: string

  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  dateEcheance?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsEnum(Action.Qualification.Code)
  codeQualification?: Action.Qualification.Code

  @IsOptional()
  @IsString()
  @IsEnum(Action.Statut)
  @IsNotIn([Action.Statut.ANNULEE])
  status?: Action.Statut
}

export class CreateActionParLeJeunePayload extends CreateActionPayload {
  @IsOptional()
  @IsBoolean()
  rappel?: boolean
}
