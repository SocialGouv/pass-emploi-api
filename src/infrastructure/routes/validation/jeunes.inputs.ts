import { ApiProperty } from '@nestjs/swagger'

import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString
} from 'class-validator'
import { RendezVous } from 'src/domain/rendez-vous'

export class PutNotificationTokenInput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  registration_token: string
}

export class TransfererConseillerPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idConseillerSource: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idConseillerCible: string

  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  idsJeune: string[]
}

export class GetRendezVousJeuneQueryParams {
  @ApiProperty({ required: false, enum: RendezVous.Periode })
  @IsOptional()
  @IsString()
  @IsEnum(RendezVous.Periode)
  periode?: RendezVous.Periode
}
