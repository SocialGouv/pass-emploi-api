import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional
} from 'class-validator'
import { Transform } from 'class-transformer'
import { transformStringToBoolean } from '../../validation/utils/transformers'

export class GetSessionsJeunesQueryParams {
  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  dateDebut?: string

  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  dateFin?: string

  @IsOptional()
  @IsBoolean()
  @Transform(params => transformStringToBoolean(params, 'filtrerEstInscrit'))
  filtrerEstInscrit?: boolean
}
