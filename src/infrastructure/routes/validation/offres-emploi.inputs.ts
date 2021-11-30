import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator'

enum Experience {
  exp1 = '1',
  exp2 = '2',
  exp3 = '3'
}
export class FindOffresEmploiQuery {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  page?: string

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  limit?: string

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(Experience, { each: true })
  experience?: Experience[]
}
