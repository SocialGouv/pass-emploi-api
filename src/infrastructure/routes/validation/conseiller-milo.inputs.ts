import { ApiProperty } from '@nestjs/swagger'
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional
} from 'class-validator'

export class GetSessionsQueryParams {
  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  dateDebut?: string

  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  dateFin?: string
}

export class UpdateSessionMiloPayload {
  @ApiProperty()
  @IsBoolean()
  estVisible: boolean
}
