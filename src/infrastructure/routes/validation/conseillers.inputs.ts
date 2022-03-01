import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator'
import { Core } from 'src/domain/core'
import { Action } from '../../../domain/action'

export class GetConseillerQueryParams {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string
}

export class CreateActionPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  comment?: string
}

export class CreateActionAvecStatutPayload extends CreateActionPayload {
  @ApiProperty({ enum: Action.Statut })
  @IsString()
  @IsEnum(Action.Statut)
  @IsOptional()
  status?: Action.Statut
}

export class CreateJeunePoleEmploiPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idConseiller: string
}

export class CreerJeuneMiloPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idDossier: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nom: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  prenom: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idConseiller: string
}

export class EnvoyerNotificationsPayload {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  idsJeunes: string[]
}

class Superviseur {
  @ApiProperty()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({
    enum: Core.Structure,
    example: Object.values(Core.Structure).join(' | ')
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(Core.Structure)
  structure: Core.Structure
}

export class SuperviseursPayload {
  @ApiProperty({ type: Superviseur, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Superviseur)
  superviseurs: Superviseur[]
}
