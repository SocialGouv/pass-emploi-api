import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator'
import { Offre } from 'src/domain/offre/offre'

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

  @ApiProperty({ type: LocalisationPayload })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalisationPayload)
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

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  origineNom?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  origineLogo?: string

  @IsBoolean()
  @IsOptional()
  aPostule?: boolean
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

  @IsBoolean()
  @IsOptional()
  aPostule?: boolean
}

export class AddFavoriServicesCivique implements Offre.Favori.ServiceCivique {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titre: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  domaine: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  organisation?: string

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  dateDeDebut?: string

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  ville?: string

  @IsBoolean()
  @IsOptional()
  aPostule?: boolean
}

export class GetFavorisQueryParams {
  @IsOptional()
  @IsDateString()
  dateDebut?: string

  @IsOptional()
  @IsDateString()
  dateFin?: string
}
