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
  @IsString()
  @IsEnum(Action.Statut)
  status?: Action.Statut

  @ApiPropertyOptional()
  @IsString()
  contenu?: string

  @ApiPropertyOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ type: 'string', format: 'date-time' })
  @IsDateString()
  dateEcheance?: string

  @ApiPropertyOptional({ enum: Action.Qualification })
  @IsString()
  @IsEnum(Action.Qualification)
  qualification?: Action.Qualification
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
