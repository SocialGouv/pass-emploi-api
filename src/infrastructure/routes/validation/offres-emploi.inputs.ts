import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsNumber, IsBoolean } from 'class-validator'

export class FindOffresEmploiPayload {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  page?: number

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  limit?: number

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  q?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  departement?: string

  @ApiProperty()
  @IsBoolean()
  alternance?: boolean
}
