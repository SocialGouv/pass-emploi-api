import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator'
import { Authentification } from '../../../domain/authentification'
import { Core } from '../../../domain/core'
import {
  StructureUtilisateurAuth,
  TypeUtilisateurAuth
} from '../../../application/commands/update-utilisateur.command.handler'

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

  @ApiProperty()
  @IsString()
  @IsIn([
    Authentification.Type.JEUNE,
    Authentification.Type.CONSEILLER,
    'BENEFICIAIRE'
  ])
  type: TypeUtilisateurAuth

  @ApiProperty()
  @IsString()
  @IsIn([
    Core.Structure.MILO,
    Core.Structure.POLE_EMPLOI,
    Core.Structure.POLE_EMPLOI_AIJ,
    Core.Structure.POLE_EMPLOI_BRSA,
    'FRANCE_TRAVAIL'
  ])
  structure: StructureUtilisateurAuth
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
