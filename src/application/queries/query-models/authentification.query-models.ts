import { ApiProperty } from '@nestjs/swagger'
import { Authentification } from '../../../domain/authentification'
import { Core } from '../../../domain/core'

export class UtilisateurQueryModel implements Authentification.Utilisateur {
  @ApiProperty()
  id: string

  @ApiProperty()
  prenom: string

  @ApiProperty()
  nom: string

  @ApiProperty({ required: false })
  email?: string

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
