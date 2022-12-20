import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator'
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
  @IsArray()
  @IsOptional()
  idsBeneficiaires?: string[]

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  idsListesDeDiffusion?: string[]

  @ApiProperty()
  @IsString()
  idConseiller: string

  @ApiPropertyOptional()
  @ValidateNested({ each: true })
  @Type(() => InfoPieceJointePayload)
  infoPieceJointe?: InfoPieceJointePayload
}
