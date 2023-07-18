import { ApiProperty } from '@nestjs/swagger'
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsArray,
  IsString,
  IsEnum
} from 'class-validator'
import { Type } from 'class-transformer'
import { SessionMilo } from '../../../domain/milo/session.milo'

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

class InscriptionSessionMiloPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idJeune: string

  @ApiProperty({ enum: SessionMilo.Inscription.Statut })
  @IsEnum(SessionMilo.Inscription.Statut)
  statut: SessionMilo.Inscription.Statut
}

export class UpdateSessionMiloPayload {
  @ApiProperty()
  @IsBoolean()
  estVisible: boolean

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InscriptionSessionMiloPayload)
  inscriptions?: InscriptionSessionMiloPayload[]
}
