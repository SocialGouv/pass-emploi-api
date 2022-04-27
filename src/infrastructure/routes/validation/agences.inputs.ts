import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsNotIn } from 'class-validator'
import { Core } from '../../../domain/core'
import Structure = Core.Structure

export class GetAgencesQueryParams {
  @ApiProperty({
    required: true,
    enum: Core.Structure
  })
  @IsEnum(Structure)
  @IsNotEmpty()
  structure: Structure
}

export class AgenceInput {
  @ApiPropertyOptional({ type: 'string' })
  @IsNotIn([''], { message: 'id ne peut pas être vide' })
  id?: string

  @ApiPropertyOptional({ type: 'string' })
  @IsNotIn([''], { message: 'nom ne peut pas être vide' })
  nom?: string
}
