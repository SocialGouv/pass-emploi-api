import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsNotEmpty, IsString } from 'class-validator'

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
