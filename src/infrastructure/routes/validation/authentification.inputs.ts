import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString, IsEmail } from 'class-validator'
import { Authentification } from '../../../domain/authentification'
import { Core } from '../../../domain/core'

export class UpdateUserPayload {
  @ApiProperty()
  @IsString()
  @IsOptional()
  nom?: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  prenom?: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiProperty({ enum: Authentification.Type })
  @IsString()
  @IsEnum(Authentification.Type)
  type: Authentification.Type

  @ApiProperty({ enum: Core.Structure })
  @IsString()
  @IsEnum(Core.Structure)
  structure: Core.Structure

  @ApiProperty()
  @IsString()
  @IsOptional()
  federatedToken?: string
}
