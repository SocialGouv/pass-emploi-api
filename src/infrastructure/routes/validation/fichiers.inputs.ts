import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ArrayNotEmpty, IsArray, IsOptional, ValidateIf } from 'class-validator'
import { Transform } from 'class-transformer'
import { transformStringToArray } from './utils/transformers'

export class TeleverserFichierPayload {
  @ApiPropertyOptional()
  @ValidateIf(payload => !Boolean(payload.listesDeDiffusionIds))
  @Transform(params => transformStringToArray(params, 'jeunesIds'))
  @IsArray()
  @ArrayNotEmpty()
  jeunesIds?: string[]

  @ApiPropertyOptional()
  @ValidateIf(payload => !Boolean(payload.jeunesIds))
  @Transform(params => transformStringToArray(params, 'listesDeDiffusionIds'))
  @IsArray()
  @ArrayNotEmpty()
  listesDeDiffusionIds?: string[]

  @ApiProperty({ type: 'string', format: 'binary' })
  fichier: Express.Multer.File

  @ApiPropertyOptional()
  @IsOptional()
  nom?: string
}
