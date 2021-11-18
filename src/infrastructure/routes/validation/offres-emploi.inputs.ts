import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator'

export class FindOffresEmploiPayload {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  page?: number

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  limit?: number

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  q?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  departement?: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  alternance?: string
}
