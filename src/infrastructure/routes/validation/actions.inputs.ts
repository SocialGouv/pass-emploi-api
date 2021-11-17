import { ApiProperty } from '@nestjs/swagger'
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  ValidateIf
} from 'class-validator'
import { Action } from '../../../domain/action'

export class UpdateStatutActionPayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsIn(Action.statutsPossibles)
  status?: string

  @ApiProperty()
  @ValidateIf(
    (payload: UpdateStatutActionPayload) => payload.isDone === undefined
  )
  @IsBoolean()
  @IsOptional()
  isDone?: boolean
}
