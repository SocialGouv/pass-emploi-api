import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
  ValidateNested
} from 'class-validator'
import { FindOffresEmploiQueryBody } from './offres-emploi.inputs'
import { GetOffresImmersionQueryBody } from './offres-immersion.inputs'
import { Type } from 'class-transformer'
import {
  CustomOffresEmploiCriteres,
  CustomOffresImmersionCriteres
} from './utils/validators'

export class CreateRechercheImmersionPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titre: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  metier?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  localisation?: string

  @ApiProperty({ type: GetOffresImmersionQueryBody })
  @Validate(CustomOffresImmersionCriteres, {
    message:
      'Certaines clés ne sont pas présentes dans le schéma de GetOffresImmersionQueryBody'
  })
  @ValidateNested({ always: true })
  @Type(() => GetOffresImmersionQueryBody)
  criteres: GetOffresImmersionQueryBody
}

export class CreateRechercheOffresEmploiPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titre: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  metier?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  localisation?: string

  @ApiPropertyOptional({ type: FindOffresEmploiQueryBody })
  @Validate(CustomOffresEmploiCriteres, {
    message:
      'Certaines clés ne sont pas présentes dans le schéma de FindOffresEmploiQueryBody'
  })
  @ValidateNested({ always: true })
  @Type(() => FindOffresEmploiQueryBody)
  criteres?: FindOffresEmploiQueryBody
}
