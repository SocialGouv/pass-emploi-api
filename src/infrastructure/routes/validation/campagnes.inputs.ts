import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator'

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
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  idQuestion: number

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  idOption: number

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pourquoi: string
}
