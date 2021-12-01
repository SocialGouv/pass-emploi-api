import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, TransformFnParams } from 'class-transformer'
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsIn,
  IsBoolean
} from 'class-validator'

enum Experience {
  exp1 = '1',
  exp2 = '2',
  exp3 = '3'
}

function transformStringToArray(params: TransformFnParams, key: string): [] {
  if (typeof params.value === 'string') {
    params.obj[key] = [params.value]
  }
  return params.obj[key]
}

function transformStringToBoolean(
  params: TransformFnParams,
  key: string
): boolean {
  params.obj[key] = params.value === 'true'
  return params.obj[key]
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
  @IsBoolean()
  @IsOptional()
  @IsIn([true, false])
  @Transform(params => transformStringToBoolean(params, 'alternance'))
  alternance?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(Experience, { each: true })
  @Transform(params => transformStringToArray(params, 'experience'))
  experience?: Experience[]
}
