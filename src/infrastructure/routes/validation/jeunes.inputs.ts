import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator'
import { LocalisationPayload } from './conseillers.inputs'

export class PutNotificationTokenInput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  registration_token: string
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
  @IsString()
  localisation?: LocalisationPayload

  @ApiProperty()
  @IsBoolean()
  alternance?: boolean

  @ApiProperty()
  @IsString()
  duree?: string
}
