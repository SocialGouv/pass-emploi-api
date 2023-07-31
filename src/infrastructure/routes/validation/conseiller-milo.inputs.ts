import { ApiProperty } from '@nestjs/swagger'
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsArray,
  IsString,
  IsEnum,
  ValidateIf,
  IsDefined
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

  @ApiProperty()
  @IsEnum(SessionMilo.Modification.StatutInscription)
  statut: SessionMilo.Modification.StatutInscription

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  commentaire?: string
}

export class UpdateSessionMiloPayload {
  @ApiProperty()
  @ValidateIf(
    payload =>
      payload.inscriptions === undefined || payload.estVisible !== undefined
  )
  @IsDefined({ message: 'Au moins un des champs doit être renseigné' })
  @IsBoolean()
  estVisible?: boolean

  @ApiProperty()
  @ValidateIf(
    payload =>
      payload.estVisible === undefined || payload.inscriptions !== undefined
  )
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InscriptionSessionMiloPayload)
  inscriptions?: InscriptionSessionMiloPayload[]
}
