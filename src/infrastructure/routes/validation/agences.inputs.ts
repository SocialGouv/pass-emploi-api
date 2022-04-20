import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty } from 'class-validator'
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
