import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class CreateRendezVousPayload {
  @ApiProperty()
  @IsString()
  comment: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  date: string

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  duration: number

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  modality: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  jeuneId: string
}
