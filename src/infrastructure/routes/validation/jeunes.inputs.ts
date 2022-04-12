import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  ArrayNotEmpty,
  Equals,
  IsArray,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf
} from 'class-validator'
import { transformStringToDate } from './utils/transformers'

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
  @ApiProperty({
    description: 'date incluse',
    required: false
  })
  @IsOptional()
  @IsDate()
  @Transform(params => transformStringToDate(params, 'dateMin'))
  dateMin?: Date

  @ApiProperty({
    description: 'date exclue',
    required: false
  })
  @IsOptional()
  @IsDate()
  @Transform(params => transformStringToDate(params, 'dateMax'))
  @ValidateIf(payload => payload.dateMin !== undefined)
  @Equals(undefined)
  dateMax?: Date
}
