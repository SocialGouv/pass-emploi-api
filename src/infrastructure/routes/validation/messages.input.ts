import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsString, ValidateIf, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class InfoPieceJointePayload {
  @ApiProperty()
  @IsString()
  id: string

  @ApiProperty()
  @IsString()
  nom: string
}

export class EnvoyerMessagePayload {
  @ApiProperty()
  @IsString()
  message: string

  @ApiProperty()
  @IsString()
  iv: string

  @ApiPropertyOptional()
  @ValidateIf(dto => !Boolean(dto.idsListesDeDiffusion))
  @IsArray()
  idsBeneficiaires?: string[]

  @ApiPropertyOptional()
  @ValidateIf(dto => !Boolean(dto.idsBeneficiaires))
  @IsArray()
  idsListesDeDiffusion?: string[]

  @ApiProperty()
  @IsString()
  idConseiller: string

  @ApiPropertyOptional()
  @ValidateNested({ each: true })
  @Type(() => InfoPieceJointePayload)
  infoPieceJointe?: InfoPieceJointePayload
}

export class RechercherMessagePayload {
  @ApiProperty()
  @IsString()
  recherche: string
}
