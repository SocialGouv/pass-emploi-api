import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested
} from 'class-validator'
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

  @ApiPropertyOptional()
  @ValidateNested({ each: true })
  @Type(() => InfoPieceJointePayload)
  infoPieceJointe?: InfoPieceJointePayload
}
