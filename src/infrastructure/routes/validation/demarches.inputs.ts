import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsDate, IsEnum, IsOptional } from 'class-validator'
import { Demarche } from '../../../domain/demarche'
import { Type } from 'class-transformer'

export class UpdateStatutDemarchePayload {
  @ApiProperty({ enum: Demarche.Statut })
  @IsEnum(Demarche.Statut)
  statut: Demarche.Statut

  @ApiPropertyOptional({ type: Date })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateDebut?: Date
}
