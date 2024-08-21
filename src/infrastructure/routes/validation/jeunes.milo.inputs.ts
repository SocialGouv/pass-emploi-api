import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional
} from 'class-validator'
import { Transform } from 'class-transformer'
import { transformStringToBoolean } from './utils/transformers'

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

export class GetMonSuiviQueryParams {
  @IsNotEmpty()
  @IsDateString()
  dateDebut: string

  @IsNotEmpty()
  @IsDateString()
  dateFin: string
}

export class GetPortefeuilleParams {
  @IsNotEmpty()
  @IsDateString()
  dateDebut: string

  @IsNotEmpty()
  @IsDateString()
  dateFin: string
}
