import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNotIn,
  IsOptional,
  IsString
} from 'class-validator'
import { Action } from '../../../domain/action/action'

export class UpdateStatutActionPayload {
  @ApiProperty({ enum: Action.Statut })
  @IsString()
  @IsEnum(Action.Statut)
  status: Action.Statut
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
}

export class CreateActionParLeJeunePayload extends CreateActionPayload {
  @ApiProperty({ enum: Action.Statut })
  @IsString()
  @IsEnum(Action.Statut)
  @IsNotIn([Action.Statut.ANNULEE])
  @IsOptional()
  status?: Action.Statut

  @IsOptional()
  @IsBoolean()
  rappel?: boolean
}
