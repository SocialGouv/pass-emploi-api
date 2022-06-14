import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsEnum, IsNotEmpty, IsOptional, Length } from 'class-validator'
import { Demarche } from '../../../domain/demarche'

export class UpdateStatutDemarchePayload {
  @ApiProperty({ enum: Demarche.Statut })
  @IsEnum(Demarche.Statut)
  statut: Demarche.Statut

  @ApiProperty({ type: Date })
  @Type(() => Date)
  @IsDate()
  dateFin: Date

  @ApiPropertyOptional({ type: Date })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateDebut?: Date
}

export class CreateDemarchePayload {
  @ApiProperty({ type: Date })
  @Type(() => Date)
  @IsDate()
  dateFin: Date

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
}

export class TypesDemarchesQueryParams {
  @ApiProperty({
    required: true
  })
  @IsNotEmpty()
  recherche: string
}
