import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { AgenceQueryModel } from './agence.query-models'
import { IsString } from 'class-validator'

export class DetailConseillerQueryModel {
  @ApiProperty()
  @IsString()
  id: string

  @ApiProperty()
  @IsString()
  firstName: string

  @ApiProperty()
  @IsString()
  lastName: string

  @ApiPropertyOptional()
  @IsString()
  email?: string

  @ApiProperty({ required: false })
  @IsString()
  agence?: AgenceQueryModel
}
