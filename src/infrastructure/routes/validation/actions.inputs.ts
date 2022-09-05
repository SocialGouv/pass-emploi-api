import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsDate,
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
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  dateDebut?: Date

  @ApiPropertyOptional({ type: 'string', format: 'date-time' })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  dateFinReelle?: Date
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
  @IsDate()
  @Transform(({ value }) => new Date(value))
  dateEcheance?: Date
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
