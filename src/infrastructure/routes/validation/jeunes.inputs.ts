import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator'

export class PutNotificationTokenInput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  registration_token: string
}

export class LocalisationPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nom: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  codePostal: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  commune: string
}

export class AddFavoriPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idOffre: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titre: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  typeContrat: string

  @ApiProperty()
  @IsString()
  nomEntreprise?: string

  @ApiProperty()
  localisation?: LocalisationPayload

  @ApiProperty()
  @IsBoolean()
  alternance?: boolean

  @ApiProperty()
  @IsString()
  duree?: string
}
