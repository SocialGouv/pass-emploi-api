import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { Authentification } from '../../../domain/authentification'

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
  email?: string

  @ApiProperty({ enum: Authentification.Type })
  @IsString()
  @IsEnum(Authentification.Type)
  type: Authentification.Type

  @ApiProperty({ enum: Authentification.Structure })
  @IsString()
  @IsEnum(Authentification.Structure)
  structure: Authentification.Structure

  @ApiProperty()
  @IsString()
  @IsOptional()
  federatedToken?: string
}
