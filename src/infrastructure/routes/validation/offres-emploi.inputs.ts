import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator'

export class FindOffresEmploiPayload {
  @ApiPropertyOptional()
  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  page?: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  limit?: number

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  q?: string

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  departement?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  alternance?: string
}
