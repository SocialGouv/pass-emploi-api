import { ApiProperty } from '@nestjs/swagger'
import { IsDefined, IsEnum, IsString, ValidateNested } from 'class-validator'
import { Authentification } from '../../../domain/authentification'
import { Core } from '../../../domain/core'
import { Evenement } from '../../../domain/evenement'
import { Type } from 'class-transformer'

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
  @ApiProperty({ enum: Evenement.Code })
  @IsString()
  @IsEnum(Evenement.Code)
  type: Evenement.Code

  @ApiProperty({ type: Emetteur })
  @ValidateNested()
  @Type(() => Emetteur)
  @IsDefined()
  emetteur: Emetteur
}
