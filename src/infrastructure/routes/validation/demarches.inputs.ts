import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  Length
} from 'class-validator'
import { Demarche } from '../../../domain/demarche'

export class UpdateStatutDemarchePayload {
  @ApiProperty({ enum: Demarche.Statut })
  @IsEnum(Demarche.Statut)
  statut: Demarche.Statut

  @ApiProperty({ type: Date })
  @IsDateString()
  dateFin: string

  @ApiPropertyOptional({ type: Date })
  @IsDateString()
  @IsOptional()
  dateDebut?: string
}

export class CreateDemarchePayload {
  @ApiProperty({ type: Date })
  @IsDateString()
  dateFin: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @Length(2, 255)
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  codeQuoi?: string

  @ApiPropertyOptional()
  @IsOptional()
  codePourquoi?: string

  @ApiPropertyOptional()
  @IsOptional()
  codeComment?: string

  @IsOptional()
  @IsBoolean()
  estDuplicata?: boolean
}

export class TypesDemarchesQueryParams {
  @ApiProperty({
    required: true
  })
  @IsNotEmpty()
  recherche: string
}
