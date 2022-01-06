import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsString } from 'class-validator'
import { Authentification } from '../../../domain/authentification'
import { Core } from '../../../domain/core'
import { Evenement } from '../../../domain/evenement'

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
  @ApiProperty({ enum: Evenement.Type })
  @IsString()
  @IsEnum(Evenement.Type)
  type: Evenement.Type

  @ApiProperty()
  emetteur: Emetteur
}
