import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class LocalisationPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nom?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  codePostal?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  commune?: string
}

export class AddFavoriOffresEmploiPayload {
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
  @IsOptional()
  @IsNotEmpty()
  nomEntreprise?: string

  @ApiProperty()
  @IsOptional()
  localisation?: LocalisationPayload

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  alternance?: boolean

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  duree?: string
}

export class AddFavoriImmersionPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idOffre: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  metier: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nomEtablissement: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  secteurActivite: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ville: string
}

export class GetFavorisOffresEmploiQueryParams {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  detail?: string
}

export class GetFavorisOffresImmersionQueryParams {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  detail?: string
}
