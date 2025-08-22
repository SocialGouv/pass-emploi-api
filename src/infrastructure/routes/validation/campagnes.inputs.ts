import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsDateString,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength
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

export class CreateFeedbackPayload {
  @ApiProperty()
  @IsDefined()
  @IsNumber()
  @Max(10)
  note: number

  @ApiProperty()
  @IsDefined()
  @IsString()
  @MaxLength(250)
  tag: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  commentaire?: string
}
