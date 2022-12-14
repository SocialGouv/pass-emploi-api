import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested
} from 'class-validator'
import { Chat } from '../../../domain/chat'
import { Type } from 'class-transformer'

export class InfoPieceJointePayload {
  @ApiProperty()
  @IsString()
  id: string

  @ApiProperty()
  @IsString()
  nom: string
}

export class EnvoyerMessagePayload {
  @ApiProperty()
  @IsString()
  message: string

  @ApiProperty()
  @IsString()
  iv: string

  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  idsBeneficiaires: string[]

  @ApiProperty()
  @IsString()
  idConseiller: string

  @ApiProperty({ enum: Chat.TypeMessage })
  @IsEnum(Chat.TypeMessage)
  type: Chat.TypeMessage

  @ApiPropertyOptional()
  @ValidateNested({ each: true })
  @Type(() => InfoPieceJointePayload)
  infoPieceJointe?: InfoPieceJointePayload
}
