import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsDateString,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsString
} from 'class-validator'

export class CreateCampagnePayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nom: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  dateDebut: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  dateFin: string
}

export class ReponseCampagnePayload {
  @ApiProperty({ required: true })
  @IsDefined()
  @IsNumber()
  idQuestion: number

  @ApiProperty({ required: true })
  @IsDefined()
  @IsNumber()
  idReponse: number

  @ApiPropertyOptional()
  @IsString()
  pourquoi?: string
}
