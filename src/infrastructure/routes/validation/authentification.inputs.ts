import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString, IsEmail, IsIn } from 'class-validator'
import { Authentification } from '../../../domain/authentification'
import { Core } from '../../../domain/core'

export class PutUtilisateurPayload {
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

  @ApiProperty()
  @IsString()
  @IsOptional()
  username?: string

  @ApiProperty({ enum: Authentification.Type })
  @IsString()
  @IsEnum(Authentification.Type)
  type: Authentification.Type

  @ApiProperty({ enum: Core.Structure })
  @IsString()
  @IsEnum(Core.Structure)
  structure: Core.Structure
}

export class GetUtilisateurQueryParams {
  @ApiProperty()
  @IsString()
  @IsIn([Authentification.Type.JEUNE, Authentification.Type.CONSEILLER])
  typeUtilisateur: Authentification.Type

  @ApiProperty()
  @IsString()
  @IsIn(Object.values(Core.Structure))
  structureUtilisateur: Core.Structure
}
