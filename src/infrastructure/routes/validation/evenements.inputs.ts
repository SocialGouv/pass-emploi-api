import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsString } from 'class-validator'
import { Authentification } from '../../../domain/authentification'
import { Core } from '../../../domain/core'
import { Evenements } from '../../../domain/evenements'

export class Emetteur {
  @ApiProperty()
  @IsString()
  id: string

  @ApiProperty({ enum: Authentification.Type })
  @IsString()
  @IsEnum(Authentification.Type)
  type: Authentification.Type

  @ApiProperty({ enum: Core.Structure })
  @IsString()
  @IsEnum(Core.Structure)
  structure: Core.Structure
}

export class CreateEvenementPayload {
  @ApiProperty({ enum: Evenements.Type })
  @IsString()
  @IsEnum(Evenements.Type)
  type: Evenements.Type

  @ApiProperty()
  emetteur: Emetteur
}
