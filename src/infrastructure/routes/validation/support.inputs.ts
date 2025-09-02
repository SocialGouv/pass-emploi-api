import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested
} from 'class-validator'
import { Core } from '../../../domain/core'
import { FeatureFlipTag } from '../../sequelize/models/feature-flip.sql-model'

export class TeleverserCsvPayload {
  @ApiProperty({ type: 'string', format: 'binary' })
  @ValidateIf(() => false)
  fichier: Express.Multer.File
}

export class RefreshJDDPayload {
  @ApiProperty()
  @IsString()
  idConseiller: string

  @ApiProperty()
  @IsBoolean()
  menage: boolean
}

export class ChangerAgenceConseillerPayload {
  @ApiProperty()
  @IsString()
  idConseiller: string

  @ApiProperty()
  @IsString()
  idNouvelleAgence: string
}

export class TransfererJeunesPayload {
  @ApiProperty()
  @IsString()
  idConseillerSource: string

  @ApiProperty()
  @IsString()
  idConseillerCible: string

  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
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

export class CreateSuperviseursPayload {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsEmail()
  superEmailFT?: string

  @ApiPropertyOptional({ type: Superviseur, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Superviseur)
  superviseurs?: Superviseur[]
}

export class DeleteSuperviseursPayload {
  @ApiProperty({ type: String, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  emails: string[]
}

export class UpdateFeatureFlipPayload {
  @ApiProperty({
    enum: FeatureFlipTag,
    description: Object.values(FeatureFlipTag).join(', ')
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(FeatureFlipTag)
  tagFeature: FeatureFlipTag

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @IsIn([false, true])
  supprimerExistants?: boolean

  @ApiProperty({ type: String, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  emailsConseillersAjout?: string[]

  @ApiProperty({ type: String, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  emailsConseillersSuppression?: string[]
}
