import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { Action } from '../../../domain/action'

export class CreateActionPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  comment?: string
}

export class CreateActionAvecStatutPayload extends CreateActionPayload {
  @ApiProperty({ enum: Action.Statut })
  @IsString()
  @IsEnum(Action.Statut)
  @IsOptional()
  status?: Action.Statut
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
