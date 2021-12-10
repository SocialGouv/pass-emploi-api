import { ApiProperty } from '@nestjs/swagger'
import { Authentification } from '../../../domain/authentification'

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
    enum: Authentification.Structure
  })
  structure: Authentification.Structure

  @ApiProperty({
    enum: Authentification.Type
  })
  type: Authentification.Type
}

export class FirebaseTokenQueryModel {
  @ApiProperty()
  token: string
}
