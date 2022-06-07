import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString
} from 'class-validator'
import { RendezVous } from 'src/domain/rendez-vous'
import { Action } from '../../../domain/action'
import { Transform, Type } from 'class-transformer'
import { transformStringToArray } from './utils/transformers'

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

export class GetActionsByJeuneQueryParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number

  @ApiPropertyOptional({ enum: Action.Tri })
  @IsOptional()
  @IsEnum(Action.Tri)
  tri?: Action.Tri

  @ApiPropertyOptional({ enum: Action.Statut, isArray: true })
  @IsOptional()
  @IsEnum(Action.Statut, { each: true })
  @Transform(params => transformStringToArray(params, 'statuts'))
  statuts?: Action.Statut[]
}
