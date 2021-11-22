import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { Action } from '../../../domain/action'

export class CreateActionPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  comment: string | undefined
}

export class CreateActionAvecStatutPayload extends CreateActionPayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  status: Action.Statut | undefined
}

export class CreateJeunePayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string
}
