import { ApiProperty } from '@nestjs/swagger'
import { Authentification } from '../../../domain/authentification'
import { Core } from '../../../domain/core'

export class UtilisateurQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  prenom: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  roles: Authentification.Role[]

  @ApiProperty({ required: false })
  email?: string

  @ApiProperty({ required: false })
  username?: string

  @ApiProperty({
    enum: Core.Structure
  })
  structure: Core.Structure

  @ApiProperty({
    enum: Authentification.Type
  })
  type: Authentification.Type
}

export class ChatSecretsQueryModel {
  @ApiProperty()
  token: string

  @ApiProperty()
  cle: string
}

export function queryModelFromUtilisateur(
  utilisateur: Authentification.Utilisateur
): UtilisateurQueryModel {
  return {
    id: utilisateur.id,
    prenom: utilisateur.prenom,
    nom: utilisateur.nom,
    email: utilisateur.email,
    username: utilisateur.username,
    structure: utilisateur.structure,
    type: utilisateur.type,
    roles: utilisateur.roles
  }
}
